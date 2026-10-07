import * as SecureStore from 'expo-secure-store';
import type { PoolCredentials } from './types';

// Pool API credentials stored in the OS keystore, device-only (SPEC §5).
const KEY = 'cc_pool_creds_v2';

export async function savePoolCreds(creds: PoolCredentials): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(creds), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function loadPoolCreds(): Promise<PoolCredentials | null> {
  const raw = await SecureStore.getItemAsync(KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function wipePoolCreds(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}
