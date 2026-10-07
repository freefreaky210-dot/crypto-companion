import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';

type Message = { id: string; from: 'you' | 'app'; text: string };

// Live adjustment chat box (dev companion).
// Type requests like "make the balance card bigger" while the app runs.
// Currently: logs requests locally + acknowledges. Later: wire to your
// AI backend (Phase 4) so adjustments apply automatically.
export default function ChatBox() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', from: 'app', text: 'Chat box ready. Type an adjustment request anytime.' },
  ]);

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
        <Text style={styles.headerText}>Live Adjustments</Text>
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
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Request an adjustment..."
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
  inputRow: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#232a3d' },
  input: {
    flex: 1, backgroundColor: '#1c2333', color: '#f5f7fa', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 14,
  },
  sendBtn: { marginLeft: 8, backgroundColor: '#f7931a', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  sendText: { color: '#0b0e17', fontWeight: '700' },
});
