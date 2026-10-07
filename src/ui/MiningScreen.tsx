import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import type { MiningStats } from '../mining/types';
import { getNiceHashStats, getDemoStats } from '../mining/nicehash';
import { savePoolCreds, loadPoolCreds, wipePoolCreds } from '../mining/credStore';

// Mining tab: rig monitoring dashboard.
// Live mode: NiceHash API (HMAC-signed). Demo mode: sample data, no credentials needed.
export default function MiningScreen() {
  const [stats, setStats] = useState<MiningStats | null>(null);
  const [hasCreds, setHasCreds] = useState<boolean | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [orgId, setOrgId] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    const creds = await loadPoolCreds();
    setHasCreds(!!creds);
    if (creds) {
      try {
        setStats(await getNiceHashStats(creds));
      } catch (e: any) {
        setError(e.message ?? 'Failed to reach NiceHash');
      }
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const connect = async () => {
    if (!apiKey.trim() || !apiSecret.trim() || !orgId.trim()) {
      Alert.alert('Missing fields', 'Enter API key, secret, and organization ID.');
      return;
    }
    await savePoolCreds({ apiKey: apiKey.trim(), apiSecret: apiSecret.trim(), orgId: orgId.trim() });
    setShowConfig(false);
    await load();
  };

  const fmtHash = (hs: number) => {
    if (hs >= 1e12) return (hs / 1e12).toFixed(1) + ' TH/s';
    if (hs >= 1e9) return (hs / 1e9).toFixed(1) + ' GH/s';
    if (hs >= 1e6) return (hs / 1e6).toFixed(1) + ' MH/s';
    return hs.toFixed(0) + ' H/s';
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f7931a" />}>
      <Text style={styles.title}>Mining</Text>

      {hasCreds === false && !showConfig && (
        <>
          <Text style={styles.hint}>Connect your mining pool to monitor rigs, hashrate, and earnings.</Text>
          <Btn label="Connect NiceHash account" onPress={() => setShowConfig(true)} primary />
          <Btn label="View demo mode" onPress={() => setStats(getDemoStats())} />
        </>
      )}

      {showConfig && (
        <>
          <Text style={styles.hint}>Create a read-only API key at nicehash.com → Settings → API Keys. Stored encrypted on this device only.</Text>
          <TextInput style={styles.input} value={apiKey} onChangeText={setApiKey} placeholder="API Key" placeholderTextColor="#8b93a7" autoCapitalize="none" />
          <TextInput style={styles.input} value={apiSecret} onChangeText={setApiSecret} placeholder="API Secret" placeholderTextColor="#8b93a7" autoCapitalize="none" secureTextEntry />
          <TextInput style={styles.input} value={orgId} onChangeText={setOrgId} placeholder="Organization ID" placeholderTextColor="#8b93a7" autoCapitalize="none" />
          <Btn label="Connect" onPress={connect} primary />
          <Btn label="Cancel" onPress={() => setShowConfig(false)} />
        </>
      )}

      {error !== '' && <Text style={styles.warn}>{error}</Text>}

      {stats && (
        <>
          <View style={styles.summary}>
            <Text style={styles.poolName}>{stats.pool}</Text>
            <Text style={styles.bigHash}>{fmtHash(stats.totalHashrateHs)}</Text>
            <Text style={styles.line}>Active rigs: {stats.activeRigs}/{stats.totalRigs}</Text>
            <Text style={styles.line}>Unpaid: {stats.unpaidBtc} BTC</Text>
            <Text style={styles.updated}>Updated {new Date(stats.fetchedAt).toLocaleTimeString()}</Text>
          </View>
          {stats.rigs.map((r) => (
            <View key={r.id} style={styles.rigCard}>
              <Text style={styles.rigName}>{r.name}</Text>
              <Text style={[styles.rigStatus, { color: r.status === 'MINING' ? '#4bbf6b' : '#e2b34b' }]}>
                {r.status}
              </Text>
              <Text style={styles.line}>{fmtHash(r.hashrateHs)}
                {r.temperatureC ? `   🌡 ${r.temperatureC}°C` : ''}
                {r.powerW ? `   ⚡ ${r.powerW}W` : ''}
              </Text>
            </View>
          ))}
          {hasCreds && <Btn label="Disconnect pool" onPress={async () => { await wipePoolCreds(); setStats(null); setHasCreds(false); }} />}
        </>
      )}
    </ScrollView>
  );
}

function Btn({ label, onPress, primary }: { label: string; onPress: () => void; primary?: boolean }) {
  return (
    <TouchableOpacity style={[styles.btn, primary && styles.btnPrimary]} onPress={onPress}>
      <Text style={[styles.btnText, primary && styles.btnTextPrimary]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b0e17' },
  content: { padding: 16, paddingBottom: 160 },
  title: { color: '#f5f7fa', fontSize: 26, fontWeight: '700', marginBottom: 12 },
  hint: { color: '#8b93a7', fontSize: 13, lineHeight: 19, marginBottom: 12 },
  warn: { color: '#e2b34b', fontSize: 13, marginBottom: 12 },
  input: { backgroundColor: '#1c2333', color: '#f5f7fa', borderRadius: 10, padding: 12, marginBottom: 10 },
  btn: { backgroundColor: '#1c2333', borderRadius: 10, padding: 14, marginBottom: 10, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#f7931a' },
  btnText: { color: '#c3cad9', fontWeight: '600' },
  btnTextPrimary: { color: '#0b0e17' },
  summary: { backgroundColor: '#141a2a', borderRadius: 14, padding: 16, marginBottom: 12 },
  poolName: { color: '#8b93a7', fontSize: 13 },
  bigHash: { color: '#f7931a', fontSize: 30, fontWeight: '700', marginVertical: 6 },
  line: { color: '#c3cad9', fontSize: 14, marginTop: 4 },
  updated: { color: '#5f6678', fontSize: 11, marginTop: 8 },
  rigCard: { backgroundColor: '#141a2a', borderRadius: 12, padding: 14, marginBottom: 10 },
  rigName: { color: '#f5f7fa', fontSize: 15, fontWeight: '600' },
  rigStatus: { fontSize: 12, fontWeight: '700', marginTop: 2 },
});
