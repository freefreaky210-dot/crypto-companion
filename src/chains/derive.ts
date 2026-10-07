import * as bip39 from 'bip39';
import BIP32Factory from 'bip32';
import * as ecc from '@bitcoinerlab/secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import { ethers } from 'ethers';

// BIP44 address derivation from the stored mnemonic (SPEC §4).
// BTC: m/84'/0'/0'/0/0  (MAINNET native SegWit / bech32)
// ETH: m/44'/60'/0'/0/0 (mainnet; same address format on all EVM chains)
// WARNING: mainnet-only per owner decision. Real funds at risk until M5 audit.

const bip32 = BIP32Factory(ecc);

export type DerivedAddresses = { btc: string; eth: string };

export async function deriveAddresses(mnemonic: string): Promise<DerivedAddresses> {
  const seed = await bip39.mnemonicToSeed(mnemonic);

  // --- Bitcoin (MAINNET) ---
  const root = bip32.fromSeed(seed, bitcoin.networks.bitcoin);
  const btcChild = root.derivePath("m/84'/0'/0'/0/0");
  const { address: btc } = bitcoin.payments.p2wpkh({
    pubkey: Buffer.from(btcChild.publicKey),
    network: bitcoin.networks.bitcoin,
  });

  // --- Ethereum (mainnet) ---
  const ethNode = ethers.HDNodeWallet.fromSeed(ethers.hexlify(seed.slice(0, 32)))
    .derivePath("m/44'/60'/0'/0/0");

  return { btc: btc ?? '', eth: ethNode.address };
}
