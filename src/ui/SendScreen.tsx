import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { loadSeed } from '../wallet/keyStore';
import { requireAuth } from '../wallet/auth';
import { sendBtc, getBtcFeeRates, FeeRates } from '../chains/bitcoin';
import { sendEth, getEthFee } from '../chains/ethereum';

// M2: Send flow. Review screen -> biometric/PIN confirm -> broadcast (SPEC §5.4).
// MAINNET: real funds.
type Coin = 'BTC' | 'ETH';
type Step = 'form' | 'review' | 'sending' | 'sent';

export default function SendScreen() {
  const [coin, setCoin] = useState<Coin>('BTC');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState<'economy' | 'normal' | 'priority'>('normal');
  const [btcFees, setBtcFees] = useState<FeeRates | null>(null);
  const [step, setStep] = useState<Step>('form');
  const [txid, setTxid] = useState('');
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);

  useEffect(() => {
    loadSeed().then((s) => setHasWallet(!!s));
    getBtcFeeRates().then(setBtcFees).catch(() => {});
  }, []);

  const review = () => {
    if (!to.trim() || !amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Check inputs', 'Enter a valid address and amount.');
      return;
    }
    setStep('review');
  };

  const confirmAndSend = async () => {
    // SPEC §5.3: biometric/PIN on EVERY send — no exceptions.
    const ok = await requireAuth(`Send ${amount} ${coin}?`);
    if (!ok) {
      Alert.alert('Not authorized', 'Transaction cancelled.');
      return;
    }
    const mnemonic = await loadSeed();
    if (!mnemonic) return;

    setStep('sending');
    try {
      let hash: string;
      if (coin === 'BTC') {
        const rate = btcFees ? btcFees[fee] : 5;
        hash = await sendBtc(mnemonic, to.trim(), Number(amount), rate);
      } else {
        hash = await sendEth(mnemonic, to.trim(), Number(amount));
      }
      setTxid(hash);
      setStep('sent');
    } catch (e: any) {
      Alert.alert('Send failed', e.message ?? String(e));
      setStep('form');
    }
  };

  if (hasWallet === false) {
    return (
      <View style={styles.center}>
        <Text style={styles.hint}>Create or import a wallet first (Wallet tab).</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Send</Text>

      {step === 'form' && (
        <>
          <View style={styles.coinRow}>
            {(['BTC', 'ETH'] as Coin[]).map((c) => (
              <TouchableOpacity key={c} style={[styles.coinBtn, coin === c && styles.coinActive]} onPress={() => setCoin(c)}>
                <Text style={styles.coinText}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>To address</Text>
          <TextInput style={styles.input} value={to} onChangeText={setTo} autoCapitalize="none"
            autoCorrect={false} placeholder={coin === 'BTC' ? 'bc1...' : '0x...'} placeholderTextColor="#8b93a7" />
          <Text style={styles.label}>Amount ({coin})</Text>
          <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad"
            placeholder="0.00" placeholderTextColor="#8b93a7" />
          {coin === 'BTC' && (
            <>
              <Text style={styles.label}>Fee rate (sat/vB)</Text>
              <View style={styles.coinRow}>
                {(['economy', 'normal', 'priority'] as const).map((f) => (
                  <TouchableOpacity key={f} style={[styles.coinBtn, fee === f && styles.coinActive]} onPress={() => setFee(f)}>
                    <Text style={styles.coinText}>{f}{btcFees ? ` ~${Math.round(btcFees[f])}` : ''}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
          <Btn label="Review transaction" onPress={review} primary />
        </>
      )}

      {step === 'review' && (
        <>
          <View style={styles.reviewCard}>
            <Text style={styles.reviewBig}>{amount} {coin}</Text>
            <Text style={styles.reviewLine}>To: {to}</Text>
            {coin === 'BTC' && <Text style={styles.reviewLine}>Fee tier: {fee}</Text>}
            <Text style={styles.warn}>MAINNET — this is irreversible. Verify the address.</Text>
          </View>
          <Btn label="Confirm with biometric/PIN" onPress={confirmAndSend} primary />
          <Btn label="Back" onPress={() => setStep('form')} />
        </>
      )}

      {step === 'sending' && <Text style={styles.hint}>Broadcasting…</Text>}

      {step === 'sent' && (
        <>
          <Text style={styles.success}>✅ Broadcast successful</Text>
          <Text style={styles.txid} selectable>{txid}</Text>
          <Btn label="Send another" onPress={() => { setTo(''); setAmount(''); setStep('form'); }} primary />
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: '#f5f7fa', fontSize: 26, fontWeight: '700', marginBottom: 16 },
  label: { color: '#c3cad9', fontSize: 14, marginBottom: 6, marginTop: 8 },
  input: { backgroundColor: '#1c2333', color: '#f5f7fa', borderRadius: 10, padding: 12, marginBottom: 8 },
  coinRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  coinBtn: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: '#1c2333', alignItems: 'center' },
  coinActive: { backgroundColor: '#f7931a' },
  coinText: { color: '#f5f7fa', fontWeight: '600', fontSize: 13 },
  btn: { backgroundColor: '#1c2333', borderRadius: 10, padding: 14, marginTop: 8, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#f7931a' },
  btnText: { color: '#c3cad9', fontWeight: '600' },
  btnTextPrimary: { color: '#0b0e17' },
  hint: { color: '#8b93a7', fontSize: 14, lineHeight: 20 },
  warn: { color: '#e2b34b', fontSize: 13, marginTop: 10, lineHeight: 18 },
  reviewCard: { backgroundColor: '#141a2a', borderRadius: 12, padding: 16, marginBottom: 8 },
  reviewBig: { color: '#f5f7fa', fontSize: 26, fontWeight: '700' },
  reviewLine: { color: '#c3cad9', fontSize: 13, marginTop: 8 },
  success: { color: '#4bbf6b', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  txid: { color: '#8b93a7', fontSize: 12, marginBottom: 8 },
});
