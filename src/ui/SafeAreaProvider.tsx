import React, { ReactNode } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

// Wrapper so every screen respects notches/status bars.
// Swap for react-native-safe-area-context when dependencies are installed.
export function SafeAreaProvider({ children }: { children: ReactNode }) {
  return <SafeAreaView style={styles.container}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0e17' },
});
