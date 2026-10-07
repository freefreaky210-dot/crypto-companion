import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

type Message = { id: string; from: 'you' | 'app'; text: string };

// Live adjustment chat box with VOICE MODE.
// Tap 🎤 and speak — your words fill the input automatically.
// Tap again to stop. Then hit Send (or keep talking).
export default function ChatBox() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', from: 'app', text: 'Chat ready. Type or tap 🎤 and speak your adjustment.' },
  ]);

  // Speech recognition events
  useSpeechRecognitionEvent('result', (e) => {
    const transcript = e.results[0]?.transcript;
    if (transcript) setInput(transcript);
  });
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('error', () => setListening(false));

  const toggleVoice = async () => {
    if (listening) {
      ExpoSpeechRecognitionModule.stop();
      setListening(false);
      return;
    }
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Microphone needed', 'Allow microphone + speech recognition in settings to use voice mode.');
      return;
    }
    setInput('');
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true, // words appear live as you speak
      continuous: false,
    });
    setListening(true);
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [
      ...m,
      { id: String(m.length), from: 'you', text },
      { id: String(m.length + 1), from: 'app', text: `Logged: "${text}" — will be applied in the next update.` },
    ]);
    setInput('');
  };

  if (!open) {
    return (
      <TouchableOpacity style={styles.fab} onPress={() => setOpen(true)}>
        <Text style={styles.fabText}>💬</Text>
      </TouchableOpacity>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.panel}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>Live Adjustments {listening ? '🎙 Listening…' : ''}</Text>
        <TouchableOpacity onPress={() => setOpen(false)}>
          <Text style={styles.close}>✕</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        style={styles.list}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.from === 'you' ? styles.you : styles.app]}>
            <Text style={styles.bubbleText}>{item.text}</Text>
          </View>
        )}
      />
      <View style={styles.inputRow}>
        <TouchableOpacity style={[styles.micBtn, listening && styles.micActive]} onPress={toggleVoice}>
          <Text style={styles.micText}>{listening ? '⏹' : '🎤'}</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={listening ? 'Listening… speak now' : 'Type or tap 🎤'}
          placeholderTextColor="#8b93a7"
          onSubmitEditing={send}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={send}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute', right: 16, bottom: 24, width: 56, height: 56,
    borderRadius: 28, backgroundColor: '#f7931a', alignItems: 'center', justifyContent: 'center',
  },
  fabText: { fontSize: 24 },
  panel: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%',
    backgroundColor: '#10141f', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    borderTopWidth: 1, borderColor: '#232a3d',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 12, borderBottomWidth: 1, borderBottomColor: '#232a3d',
  },
  headerText: { color: '#f5f7fa', fontWeight: '700', fontSize: 15 },
  close: { color: '#8b93a7', fontSize: 18, paddingHorizontal: 8 },
  list: { flex: 1, padding: 12 },
  bubble: { padding: 10, borderRadius: 10, marginBottom: 8, maxWidth: '85%' },
  you: { backgroundColor: '#f7931a', alignSelf: 'flex-end' },
  app: { backgroundColor: '#1c2333', alignSelf: 'flex-start' },
  bubbleText: { color: '#f5f7fa', fontSize: 14 },
  inputRow: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#232a3d', alignItems: 'center' },
  micBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#1c2333',
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  micActive: { backgroundColor: '#d0483e' }, // red while listening
  micText: { fontSize: 18 },
  input: {
    flex: 1, backgroundColor: '#1c2333', color: '#f5f7fa', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 14,
  },
  sendBtn: { marginLeft: 8, backgroundColor: '#f7931a', borderRadius: 10, paddingHorizontal: 16, height: 42, justifyContent: 'center' },
  sendText: { color: '#0b0e17', fontWeight: '700' },
});
