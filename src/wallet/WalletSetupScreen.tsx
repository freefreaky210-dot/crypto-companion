import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as bip39 from 'bip39';
import { saveSeed, loadSeed, wipeSeed } from './keyStore';
import { deriveAddresses, DerivedAddresses } from '../chains/derive';
import ReceiveQr from '../ui/ReceiveQr';

// M1: Wallet create/import + secure storage + address derivation + receive QRs.
// Keys generated/stored on-device only (SPEC §5). MAINNET — real funds at risk.
type Step = 'loading' | 'choice' | 'showSeed' | 'confirmQuiz' | 'import' | 'done';

export default function WalletSetupScreen() {
  const [step, setStep] = useState<Step>('loading');
  const [mnemonic, setMnemonic] = useState('');
  const [addresses, setAddresses] = useState<DerivedAddresses | null>(null);
  const [importText, setImportText] = useState('');
  const [quizWord, setQuizWord] = useState('');
  const [quizIndex, setQuizIndex] = useState(0);

  useEffect(() => {
    (async () => {
      const existing = await loadSeed();
      if (existing) {
        setMnemonic(existing);
        setAddresses(await deriveAddresses(existing));
        setStep('done');
      } else {
        setStep('choice');
      }
    })();
  }, []);

  const createWallet = () => {
    setMnemonic(bip39.generateMnemonic());
    setStep('showSeed');
  };

  const startQuiz = () => {
    const words = mnemonic.split(' ');
    setQuizIndex(Math.floor(Math.random() * words.length));
    setQuizWord('');
    setStep('confirmQuiz');
  };

  const finishSetup = async (m: string) => {
    await saveSeed(m);
    setAddresses(await deriveAddresses(m));
    setStep('done');
  };

  const checkQuiz = () => {
    if (quizWord.trim().toLowerCase() === mnemonic.split(' ')[quizIndex]) {
      finishSetup(mnemonic);
    } else {
      Alert.alert('Wrong word', 'Check your written backup and try again. You cannot skip this.');
    }
  };

  const importWallet = () => {
    const m = importText.trim().toLowerCase();
    if (!bip39.validateMnemonic(m)) {
      Alert.alert('Invalid seed', 'That recovery phrase is not a valid BIP39 mnemonic.');
      return;
    }
    setMnemonic(m);
    finishSetup(m);
  };

  const resetWallet = () => {
    Alert.alert('Erase wallet?', 'This deletes the seed from this device. Only proceed if you have your written backup.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Erase', style: 'destructive', onPress: async () => {
        await wipeSeed();
        setMnemonic('');
        setAddresses(null);
        setStep('choice');
      }},
    ]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Wallet</Text>

      {step === 'loading' && <Text style={styles.hint}>Loading…</Text>}

      {step === 'choice' && (
        <>
          <Btn label="Create new wallet" onPress={createWallet} primary />
          <Btn label="Import existing wallet" onPress={() => setStep('import')} />
          <Text style={styles.hint}>Keys are generated and stored on this device only. MAINNET: real funds — keep your written backup safe.</Text>
        </>
      )}

      {step === 'showSeed' && (
        <>
          <Text style={styles.warn}>WRITE THESE 12 WORDS DOWN. Never screenshot or share them.</Text>
          <View style={styles.seedBox}>
            {mnemonic.split(' ').map((w, i) => (
              <Text key={i} style={styles.word}>{i + 1}. {w}</Text>
            ))}
          </View>
          <Btn label="I wrote them down" onPress={startQuiz} primary />
        </>
      )}

      {step === 'confirmQuiz' && (
        <>
          <Text style={styles.label}>Enter word #{quizIndex + 1} from your backup:</Text>
          <TextInput style={styles.input} value={quizWord} onChangeText={setQuizWord}
            autoCapitalize="none" autoCorrect={false} placeholder="word" placeholderTextColor="#8b93a7" />
          <Btn label="Confirm" onPress={checkQuiz} primary />
        </>
      )}

      {step === 'import' && (
        <>
          <Text style={styles.label}>Paste your 12/24-word recovery phrase:</Text>
          <TextInput style={[styles.input, styles.multi]} value={importText} onChangeText={setImportText}
            autoCapitalize="none" autoCorrect={false} multiline placeholder="word1 word2 word3 ..." placeholderTextColor="#8b93a7" />
          <Btn label="Import" onPress={importWallet} primary />
          <Btn label="Back" onPress={() => setStep('choice')} />
        </>
      )}

      {step === 'done' && addresses && (
        <>
          <Text style={styles.success}>✅ Wallet ready — MAINNET</Text>
          <ReceiveQr label="BTC (Bitcoin mainnet)" address={addresses.btc} />
          <ReceiveQr label="ETH (Ethereum mainnet)" address={addresses.eth} />
          <Btn label="Erase wallet from device" onPress={resetWallet} />
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
  title: { color: '#f5f7fa', fontSize: 26, fontWeight: '700', marginBottom: 16 },
  btn: { backgroundColor: '#1c2333', borderRadius: 10, padding: 14, marginBottom: 10, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#f7931a' },
  btnText: { color: '#c3cad9', fontWeight: '600' },
  btnTextPrimary: { color: '#0b0e17' },
  hint: { color: '#8b93a7', fontSize: 13, marginTop: 8, lineHeight: 19 },
  warn: { color: '#e2b34b', fontSize: 13, lineHeight: 19, marginBottom: 12 },
  seedBox: { backgroundColor: '#141a2a', borderRadius: 12, padding: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  word: { color: '#f5f7fa', fontSize: 14, width: '30%' },
  label: { color: '#c3cad9', fontSize: 14, marginBottom: 8 },
  input: { backgroundColor: '#1c2333', color: '#f5f7fa', borderRadius: 10, padding: 12, marginBottom: 12 },
  multi: { minHeight: 90, textAlignVertical: 'top' },
  success: { color: '#4bbf6b', fontSize: 18, fontWeight: '700', marginBottom: 4 },
});
