import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// M4 target: time, local weather, prices, balance change.
// Placeholder with static data until weather/price APIs are wired.
export default function BriefingCard() {
  const now = new Date();
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Daily Briefing</Text>
      <Text style={styles.line}>🕐 {now.toLocaleTimeString()}</Text>
      <Text style={styles.line}>🌤 Weather: — (API pending, M4)</Text>
      <Text style={styles.line}>₿ BTC: — | Ξ ETH: — (price feed pending)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#141a2a', borderRadius: 14, padding: 16, marginBottom: 12 },
  heading: { color: '#f5f7fa', fontSize: 17, fontWeight: '600', marginBottom: 8 },
  line: { color: '#c3cad9', fontSize: 14, marginTop: 4 },
});
