import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import BriefingCard from './BriefingCard';
import BalanceCard from './BalanceCard';
import { loadSeed } from '../wallet/keyStore';
import { deriveAddresses } from '../chains/derive';
import { getBtcBalance } from '../chains/bitcoin';
import { getEthBalance } from '../chains/ethereum';

// M3: live mainnet balances on the dashboard. Pull-to-refresh.
// Offline: shows last cached values (SPEC 9.4) — cache layer TODO.
export default function DashboardScreen() {
  const [btc, setBtc] = useState<number | null>(null);
  const [eth, setEth] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [noWallet, setNoWallet] = useState(false);

  const load = async () => {
    const seed = await loadSeed();
    if (!seed) { setNoWallet(true); return; }
    setNoWallet(false);
    const addr = await deriveAddresses(seed);
    const [b, e] = await Promise.allSettled([getBtcBalance(addr.btc), getEthBalance(addr.eth)]);
    if (b.status === 'fulfilled') setBtc(b.value);
    if (e.status === 'fulfilled') setEth(e.value);
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const fmt = (n: number | null, dp: number) => (n == null ? '—' : n.toFixed(dp));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f7931a" />}>
      <Text style={styles.title}>Crypto Companion</Text>
      <BriefingCard />
      <BalanceCard symbol="BTC" balance={fmt(btc, 8)} fiat="" />
      <BalanceCard symbol="ETH" balance={fmt(eth, 6)} fiat="" />
      {noWallet && (
        <View style={styles.note}>
          <Text style={styles.noteText}>No wallet yet — open the Wallet tab to create or import one.</Text>
        </View>
      )}
      <Text style={styles.hint}>Pull down to refresh balances.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b0e17' },
  content: { padding: 16, paddingBottom: 160 },
  title: { color: '#f5f7fa', fontSize: 26, fontWeight: '700', marginBottom: 16 },
  note: { marginTop: 16, padding: 12, backgroundColor: '#141a2a', borderRadius: 10 },
  noteText: { color: '#8b93a7', fontSize: 13, lineHeight: 19 },
  hint: { color: '#5f6678', fontSize: 12, marginTop: 12, textAlign: 'center' },
});
