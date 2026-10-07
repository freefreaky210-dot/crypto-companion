import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from './src/ui/SafeAreaProvider';
import DashboardScreen from './src/ui/DashboardScreen';
import ChatBox from './src/ui/ChatBox';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <DashboardScreen />
      {/* Live adjustment chat box — floating on every screen (dev tool) */}
      <ChatBox />
    </SafeAreaProvider>
  );
}
