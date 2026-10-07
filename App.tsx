import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import React, { useState } from 'react';
import { StatusBar, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from './src/ui/SafeAreaProvider';
import DashboardScreen from './src/ui/DashboardScreen';
import WalletSetupScreen from './src/wallet/WalletSetupScreen';
import SendScreen from './src/ui/SendScreen';
import MiningScreen from './src/ui/MiningScreen';
import ChatBox from './src/ui/ChatBox';

type Tab = 'dashboard' | 'wallet' | 'send' | 'mining';

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <View style={styles.nav}>
        <NavBtn label="Home" active={tab === 'dashboard'} onPress={() => setTab('dashboard')} />
        <NavBtn label="Wallet" active={tab === 'wallet'} onPress={() => setTab('wallet')} />
        <NavBtn label="Send" active={tab === 'send'} onPress={() => setTab('send')} />
        <NavBtn label="Mining" active={tab === 'mining'} onPress={() => setTab('mining')} />
      </View>
      {tab === 'dashboard' && <DashboardScreen />}
      {tab === 'wallet' && <WalletSetupScreen />}
      {tab === 'send' && <SendScreen />}
      {tab === 'mining' && <MiningScreen />}
      {/* Live adjustment chat box — floating on every screen (dev tool) */}
      <ChatBox />
    </SafeAreaProvider>
  );
}

function NavBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.navBtn, active && styles.navBtnActive]} onPress={onPress}>
      <Text style={[styles.navText, active && styles.navTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', backgroundColor: '#10141f', padding: 8, gap: 6 },
  navBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: '#1c2333' },
  navBtnActive: { backgroundColor: '#f7931a' },
  navText: { color: '#8b93a7', fontWeight: '600', fontSize: 13 },
  navTextActive: { color: '#0b0e17' },
});
