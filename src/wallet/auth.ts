import * as LocalAuthentication from 'expo-local-authentication';

// SPEC §5.3: biometric/PIN required for every send. No exceptions.
// Falls back to device PIN/pattern when biometrics unavailable.
export async function requireAuth(reason = 'Confirm this transaction'): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) {
    // No lock hardware at all — block sends rather than downgrade security.
    return false;
  }
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    fallbackLabel: 'Use PIN',
    disableDeviceFallback: false,
  });
  return result.success;
}
