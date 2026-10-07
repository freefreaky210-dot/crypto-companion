import * as bip39 from 'bip39';
import BIP32Factory from 'bip32';
import * as ecc from '@bitcoinerlab/secp256k1';
import * as bitcoin from 'bitcoinjs-lib';

// Bitcoin MAINNET chain adapter.
// Backend: mempool.space public Esplora API (SPEC §4).
// MAINNET: real funds. All sends require biometric/PIN before calling sendBtc().

const API = 'https://mempool.space/api';
const network = bitcoin.networks.bitcoin;
const bip32 = BIP32Factory(ecc);

export type FeeRates = { economy: number; normal: number; priority: number };

async function getAccount(mnemonic: string) {
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const child = bip32.fromSeed(seed, network).derivePath("m/84'/0'/0'/0/0");
  const payment = bitcoin.payments.p2wpkh({ pubkey: Buffer.from(child.publicKey), network });
  return { child, payment, address: payment.address as string };
}

export async function getBtcBalance(address: string): Promise<number> {
  const res = await fetch(`${API}/address/${address}`);
  const j = await res.json();
  const sats = j.chain_stats.funded_txo_sum - j.chain_stats.spent_txo_sum;
  return sats / 1e8; // BTC
}

export async function getBtcFeeRates(): Promise<FeeRates> {
  const res = await fetch(`${API}/fee-estimates`);
  const j = await res.json();
  return {
    economy: j['144'] ?? 1,
    normal: j['6'] ?? 5,
    priority: j['1'] ?? 10,
  };
}

// Builds, signs, and broadcasts a mainnet BTC tx. Returns the txid.
// Caller MUST have passed biometric/PIN auth first (src/wallet/auth.ts).
export async function sendBtc(mnemonic: string, to: string, amountBtc: number, feeRate: number): Promise<string> {
  const { child, payment, address } = await getAccount(mnemonic);

  const utxoRes = await fetch(`${API}/address/${address}/utxo`);
  const utxos: any[] = await utxoRes.json();
  if (!utxos.length) throw new Error('No spendable funds.');

  const amountSats = Math.round(amountBtc * 1e8);
  const estVbytes = 10 + utxos.length * 68 + 2 * 31; // rough P2WPKH estimate
  const feeSats = Math.ceil(estVbytes * feeRate);
  const totalIn = utxos.reduce((s: number, u: any) => s + u.value, 0);
  const change = totalIn - amountSats - feeSats;
  if (change < 0) throw new Error('Insufficient funds (amount + fee exceeds balance).');

  const psbt = new bitcoin.Psbt({ network });
  for (const u of utxos) {
    psbt.addInput({
      hash: u.txid,
      index: u.vout,
      witnessUtxo: { script: payment.output as Buffer, value: BigInt(u.value) },
    });
  }
  psbt.addOutput({ address: to, value: BigInt(amountSats) });
  if (change > 546) psbt.addOutput({ address, value: BigInt(change) }); // dust guard

  psbt.signAllInputs(child);
  psbt.finalizeAllInputs();
  const txHex = psbt.extractTransaction().toHex();

  const broadcast = await fetch(`${API}/tx`, { method: 'POST', body: txHex });
  if (!broadcast.ok) throw new Error('Broadcast failed: ' + (await broadcast.text()));
  return broadcast.text(); // txid
}
