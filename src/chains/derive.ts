import * as bip39 from 'bip39';
import BIP32Factory from 'bip32';
import * as ecc from '@bitcoinerlab/secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import { ethers } from 'ethers';

// BIP44 address derivation from the stored mnemonic (SPEC §4).
// BTC: m/84'/1'/0'/0/0  (testnet native SegWit / bech32)
// ETH: m/44'/60'/0'/0/0
// Switch BTC network to bitcoin.networks.bitcoin ONLY after the M5 audit.

const bip32 = BIP32Factory(ecc);

export type DerivedAddresses = { btc: string; eth: string };

export async function deriveAddresses(mnemonic: string): Promise<DerivedAddresses> {
  const seed = await bip39.mnemonicToSeed(mnemonic);

  // --- Bitcoin (testnet) ---
  const root = bip32.fromSeed(seed, bitcoin.networks.testnet);
  const btcChild = root.derivePath("m/84'/1'/0'/0/0");
  const { address: btc } = bitcoin.payments.p2wpkh({
    pubkey: Buffer.from(btcChild.publicKey),
    network: bitcoin.networks.testnet,
  });

  // --- Ethereum ---
  const ethNode = ethers.HDNodeWallet.fromSeed(ethers.hexlify(seed.slice(0, 32)))
    .derivePath("m/44'/60'/0'/0/0");

  return { btc: btc ?? '', eth: ethNode.address };
}
