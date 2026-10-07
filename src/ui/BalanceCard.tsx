import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = { symbol: string; balance: string; fiat: string };

export default function BalanceCard({ symbol, balance, fiat }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.symbol}>{symbol}</Text>
      <Text style={styles.balance}>{balance}</Text>
      <Text style={styles.fiat}>{fiat}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#141a2a', borderRadius: 14, padding: 16, marginBottom: 12 },
  symbol: { color: '#f7931a', fontSize: 15, fontWeight: '700' },
  balance: { color: '#f5f7fa', fontSize: 24, fontWeight: '700', marginTop: 4 },
  fiat: { color: '#8b93a7', fontSize: 14, marginTop: 2 },
});
