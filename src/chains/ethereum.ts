import * as bip39 from 'bip39';
import { ethers } from 'ethers';

// Ethereum MAINNET chain adapter.
// RPC: public endpoint (swap for Alchemy/Infura key in production, SPEC §4).
// MAINNET: real funds. All sends require biometric/PIN before calling sendEth().

const RPC = 'https://eth.llamarpc.com';

export type EthFee = { gasPriceGwei: number };

async function getWallet(mnemonic: string) {
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const node = ethers.HDNodeWallet.fromSeed(ethers.hexlify(seed.slice(0, 32)))
    .derivePath("m/44'/60'/0'/0/0");
  const provider = new ethers.JsonRpcProvider(RPC);
  return node.connect(provider);
}

export async function getEthBalance(address: string): Promise<number> {
  const provider = new ethers.JsonRpcProvider(RPC);
  const wei = await provider.getBalance(address);
  return Number(ethers.formatEther(wei));
}

export async function getEthFee(): Promise<EthFee> {
  const provider = new ethers.JsonRpcProvider(RPC);
  const fee = await provider.getFeeData();
  return { gasPriceGwei: Number(ethers.formatUnits(fee.gasPrice ?? 0n, 'gwei')) };
}

// Signs and broadcasts a mainnet ETH transfer. Returns the tx hash.
// Caller MUST have passed biometric/PIN auth first (src/wallet/auth.ts).
export async function sendEth(mnemonic: string, to: string, amountEth: number): Promise<string> {
  if (!ethers.isAddress(to)) throw new Error('Invalid Ethereum address.');
  const wallet = await getWallet(mnemonic);
  const tx = await wallet.sendTransaction({ to, value: ethers.parseEther(String(amountEth)) });
  return tx.hash;
}
