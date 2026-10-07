import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, RefreshControl, Share } from 'react-native';
import type { MiningStats, PoolId } from '../mining/types';
import { getStats, getDemoStats, nicehashSetRig } from '../mining/pools';
import { savePoolCreds, loadPoolCreds, wipePoolCreds } from '../mining/credStore';
import { loadSeed } from '../wallet/keyStore';
import { deriveAddresses } from '../chains/derive';
import { requireAuth } from '../wallet/auth';
import { getPowerHints, PowerHint } from '../mining/powerHints';

// Mining tab: multi-pool rig monitoring + control + payout wiring + power hints.
export default function MiningScreen() {
  const [stats, setStats] = useState<MiningStats | null>(null);
  const [hasCreds, setHasCreds] = useState<boolean | null>(null);
  const [pool, setPool] = useState<PoolId>('nicehash');
  const [showConfig, setShowConfig] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [orgId, setOrgId] = useState('');
  const [btcAddr, setBtcAddr] = useState('');
  const [hints, setHints] = useState<PowerHint[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    const creds = await loadPoolCreds();
    setHasCreds(!!creds);
    if (creds) {
      try { setStats(await getStats(creds)); }
      catch (e: any) { setError(e.message ?? 'Pool request failed'); }
    }
    const seed = await loadSeed();
    if (seed) setBtcAddr((await deriveAddresses(seed)).btc);
    setHints(await getPowerHints());
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const connect = async () => {
    if (!apiKey.trim() || (pool === 'nicehash' && (!apiSecret.trim() || !orgId.trim()))) {
      Alert.alert('Missing fields', pool === 'nicehash' ? 'Key, secret, and org ID required.' : 'API key/token required.');
      return;
    }
    await savePoolCreds({ pool, apiKey: apiKey.trim(), apiSecret: apiSecret.trim() || undefined, orgId: orgId.trim() || undefined });
    setShowConfig(false);
    await load();
  };

  // Rig control: biometric-confirm before any start/stop (same security rule as sends).
  const controlRig = async (rigId: string, action: 'START' | 'STOP') => {
    const ok = await requireAuth(`${action} rig ${rigId}?`);
    if (!ok) return;
    const creds = await loadPoolCreds();
    if (!creds || creds.pool !== 'nicehash') return;
    try {
      await nicehashSetRig(creds, rigId, action);
      await load();
    } catch (e: any) {
      Alert.alert('Control failed', e.message ?? String(e));
    }
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

      {/* Cheap-power hints */}
      {hints.map((h, i) => (
        <View key={i} style={styles.hintCard}>
          <Text style={styles.hintTitle}>{h.title}</Text>
          <Text style={styles.hintDetail}>{h.detail}</Text>
        </View>
      ))}

      {hasCreds === false && !showConfig && (
        <>
          <Text style={styles.hint}>Connect your mining pool to monitor and control rigs.</Text>
          <Btn label="Connect pool" onPress={() => setShowConfig(true)} primary />
          <Btn label="View demo mode" onPress={() => setStats(getDemoStats())} />
        </>
      )}

      {showConfig && (
        <>
          <View style={styles.coinRow}>
            {(['nicehash', 'braiins', 'f2pool'] as PoolId[]).map((p) => (
              <TouchableOpacity key={p} style={[styles.coinBtn, pool === p && styles.coinActive]} onPress={() => setPool(p)}>
                <Text style={styles.coinText}>{p === 'nicehash' ? 'NiceHash' : p === 'braiins' ? 'Braiins' : 'F2Pool'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.hint}>Use a READ-ONLY key where possible. Stored encrypted on this device only.</Text>
          <TextInput style={styles.input} value={apiKey} onChangeText={setApiKey}
            placeholder={pool === 'f2pool' ? 'Account name / API key' : 'API Key / Token'} placeholderTextColor="#8b93a7" autoCapitalize="none" />
          {pool === 'nicehash' && (
            <>
              <TextInput style={styles.input} value={apiSecret} onChangeText={setApiSecret} placeholder="API Secret" placeholderTextColor="#8b93a7" autoCapitalize="none" secureTextEntry />
              <TextInput style={styles.input} value={orgId} onChangeText={setOrgId} placeholder="Organization ID" placeholderTextColor="#8b93a7" autoCapitalize="none" />
            </>
          )}
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

          {/* Payout wiring: point pool payouts at this app's BTC address */}
          {btcAddr !== '' && (
            <View style={styles.payoutCard}>
              <Text style={styles.hintTitle}>💰 Payout address (this wallet)</Text>
              <Text style={styles.addr} selectable>{btcAddr}</Text>
              <Btn label="Copy / share payout address" onPress={() => Share.share({ message: btcAddr })} primary />
              <Text style={styles.hint}>Paste this in your pool's payout settings so earnings land in this app.</Text>
            </View>
          )}

          {stats.rigs.map((r) => (
            <View key={r.id} style={styles.rigCard}>
              <Text style={styles.rigName}>{r.name}</Text>
              <Text style={[styles.rigStatus, { color: r.status === 'MINING' ? '#4bbf6b' : '#e2b34b' }]}>{r.status}</Text>
              <Text style={styles.line}>{fmtHash(r.hashrateHs)}{r.temperatureC ? `   🌡 ${r.temperatureC}°C` : ''}{r.powerW ? `   ⚡ ${r.powerW}W` : ''}</Text>
              {pool === 'nicehash' && hasCreds && (
                <View style={styles.coinRow}>
                  {r.status === 'MINING'
                    ? <TouchableOpacity style={styles.coinBtn} onPress={() => controlRig(r.id, 'STOP')}><Text style={styles.coinText}>⏹ Stop</Text></TouchableOpacity>
                    : <TouchableOpacity style={styles.coinBtn} onPress={() => controlRig(r.id, 'START')}><Text style={styles.coinText}>▶️ Start</Text></TouchableOpacity>}
                </View>
              )}
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
  btn: { backgroundColor: '#1c2333', borderRadius: 10, padding: 14, marginTop: 6, marginBottom: 6, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#f7931a' },
  btnText: { color: '#c3cad9', fontWeight: '600' },
  btnTextPrimary: { color: '#0b0e17' },
  coinRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  coinBtn: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: '#1c2333', alignItems: 'center' },
  coinActive: { backgroundColor: '#f7931a' },
  coinText: { color: '#f5f7fa', fontWeight: '600', fontSize: 13 },
  summary: { backgroundColor: '#141a2a', borderRadius: 14, padding: 16, marginBottom: 12 },
  poolName: { color: '#8b93a7', fontSize: 13 },
  bigHash: { color: '#f7931a', fontSize: 30, fontWeight: '700', marginVertical: 6 },
  line: { color: '#c3cad9', fontSize: 14, marginTop: 4 },
  updated: { color: '#5f6678', fontSize: 11, marginTop: 8 },
  rigCard: { backgroundColor: '#141a2a', borderRadius: 12, padding: 14, marginBottom: 10 },
  rigName: { color: '#f5f7fa', fontSize: 15, fontWeight: '600' },
  rigStatus: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  hintCard: { backgroundColor: '#101c2a', borderRadius: 12, padding: 12, marginBottom: 10 },
  hintTitle: { color: '#6db3f2', fontWeight: '700', fontSize: 13 },
  hintDetail: { color: '#8b93a7', fontSize: 12, marginTop: 4, lineHeight: 17 },
  payoutCard: { backgroundColor: '#14201a', borderRadius: 12, padding: 12, marginBottom: 12 },
  addr: { color: '#f5f7fa', fontSize: 12, marginVertical: 8 },
});
