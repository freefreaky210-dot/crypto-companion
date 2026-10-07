import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import BriefingCard from './BriefingCard';
import BalanceCard from './BalanceCard';

// M3 target: per-coin balances + combined fiat total + history.
// Currently renders placeholder data — wire to chain adapters later.
export default function DashboardScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Crypto Companion</Text>
      <BriefingCard />
      <BalanceCard symbol="BTC" balance="0.0000" fiat="$0.00" />
      <BalanceCard symbol="ETH" balance="0.0000" fiat="$0.00" />
      <View style={styles.note}>
        <Text style={styles.noteText}>
          Wallet not created yet — M1. Use the chat box below to request live adjustments.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b0e17' },
  content: { padding: 16, paddingBottom: 160 },
  title: { color: '#f5f7fa', fontSize: 26, fontWeight: '700', marginBottom: 16 },
  note: { marginTop: 16, padding: 12, backgroundColor: '#141a2a', borderRadius: 10 },
  noteText: { color: '#8b93a7', fontSize: 13, lineHeight: 19 },
});
