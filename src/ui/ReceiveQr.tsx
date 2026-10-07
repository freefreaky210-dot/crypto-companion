import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

// Receive QR for a mainnet address (M1 completion).
export default function ReceiveQr({ label, address }: { label: string; address: string }) {
  return (
    <View style={styles.box}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.qr}>
        <QRCode value={address} size={140} backgroundColor="white" color="black" />
      </View>
      <Text style={styles.addr} selectable>{address}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', marginVertical: 12 },
  label: { color: '#f7931a', fontWeight: '700', marginBottom: 8 },
  qr: { backgroundColor: '#fff', padding: 12, borderRadius: 12 },
  addr: { color: '#8b93a7', fontSize: 11, marginTop: 8, textAlign: 'center' },
});
