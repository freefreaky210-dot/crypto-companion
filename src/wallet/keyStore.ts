import * as SecureStore from 'expo-secure-store';

// Secure-enclave / hardware-keystore backed seed storage (SPEC §5.1).
// The mnemonic is encrypted by the OS keystore and never leaves the device.
const KEY = 'cc_seed_v1';

export async function saveSeed(mnemonic: string): Promise<void> {
  await SecureStore.setItemAsync(KEY, mnemonic, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY, // no cloud backup, no migration
  });
}

export async function loadSeed(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY);
}

export async function hasSeed(): Promise<boolean> {
  return (await loadSeed()) !== null;
}

export async function wipeSeed(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}
