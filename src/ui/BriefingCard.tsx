import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Prices = { btc: number | null; eth: number | null };

// M4 target: time, local weather, prices, balance change.
// Prices are LIVE via CoinGecko (no API key needed). Weather still pending.
export default function BriefingCard() {
  const [prices, setPrices] = useState<Prices>({ btc: null, eth: null });
  const [error, setError] = useState(false);
  const [updated, setUpdated] = useState<Date | null>(null);

  const load = async () => {
    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd'
      );
      const json = await res.json();
      setPrices({ btc: json.bitcoin.usd, eth: json.ethereum.usd });
      setUpdated(new Date());
      setError(false);
    } catch {
      setError(true); // offline: keep last values (see SPEC 9.4)
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000); // refresh every minute
    return () => clearInterval(t);
  }, []);

  const fmt = (n: number | null) =>
    n == null ? '—' : '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Daily Briefing</Text>
      <Text style={styles.line}>🕐 {new Date().toLocaleTimeString()}</Text>
      <Text style={styles.line}>🌤 Weather: — (API pending, M4)</Text>
      <Text style={styles.line}>₿ BTC: {fmt(prices.btc)}   Ξ ETH: {fmt(prices.eth)}</Text>
      {error && <Text style={styles.warn}>Offline — showing last known prices</Text>}
      {updated && !error && (
        <Text style={styles.updated}>Updated {updated.toLocaleTimeString()}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#141a2a', borderRadius: 14, padding: 16, marginBottom: 12 },
  heading: { color: '#f5f7fa', fontSize: 17, fontWeight: '600', marginBottom: 8 },
  line: { color: '#c3cad9', fontSize: 14, marginTop: 4 },
  warn: { color: '#e2b34b', fontSize: 12, marginTop: 8 },
  updated: { color: '#5f6678', fontSize: 11, marginTop: 8 },
});
