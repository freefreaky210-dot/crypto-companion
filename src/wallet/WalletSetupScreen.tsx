import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as bip39 from 'bip39';

// M1: Wallet create/import.
// Generates a REAL BIP39 mnemonic on-device. Keys never leave the phone (SPEC §5).
// TODO (M1 follow-ups): secure-enclave storage, backup quiz gate, BIP44 address derivation.
type Step = 'choice' | 'showSeed' | 'confirmQuiz' | 'import' | 'done';

export default function WalletSetupScreen() {
  const [step, setStep] = useState<Step>('choice');
  const [mnemonic, setMnemonic] = useState('');
  const [importText, setImportText] = useState('');
  const [quizWord, setQuizWord] = useState('');
  const [quizIndex, setQuizIndex] = useState(0);

  const createWallet = () => {
    const m = bip39.generateMnemonic(); // 12 words, 128-bit entropy
    setMnemonic(m);
    setStep('showSeed');
  };

  const startQuiz = () => {
    const words = mnemonic.split(' ');
    setQuizIndex(Math.floor(Math.random() * words.length));
    setQuizWord('');
    setStep('confirmQuiz');
  };

  const checkQuiz = () => {
    const words = mnemonic.split(' ');
    if (quizWord.trim().toLowerCase() === words[quizIndex]) {
      setStep('done');
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
    setStep('done');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Wallet Setup</Text>

      {step === 'choice' && (
        <>
          <Btn label="Create new wallet" onPress={createWallet} primary />
          <Btn label="Import existing wallet" onPress={() => setStep('import')} />
          <Text style={styles.hint}>Keys are generated and stored on this device only.</Text>
        </>
      )}

      {step === 'showSeed' && (
        <>
          <Text style={styles.warn}>WRITE THESE 12 WORDS DOWN. Never screenshot or share them. Anyone with these words can take your funds.</Text>
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

      {step === 'done' && (
        <>
          <Text style={styles.success}>✅ Wallet ready</Text>
          <Text style={styles.hint}>Address derivation (BIP44 for BTC + ETH) and secure-enclave storage land in the next M1 update. For now, your seed exists only in memory on this device.</Text>
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
  success: { color: '#4bbf6b', fontSize: 20, fontWeight: '700', marginBottom: 8 },
});
