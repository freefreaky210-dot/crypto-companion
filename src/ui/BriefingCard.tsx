import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Location from 'expo-location';

type Prices = { btc: number | null; eth: number | null };
type Weather = { tempC: number; code: number } | null;

// M4: time + live weather (open-meteo, no API key) + live prices (CoinGecko).
const WMO: Record<number, string> = {
  0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 51: 'Drizzle', 61: 'Rain', 71: 'Snow', 80: 'Showers', 95: 'Thunderstorm',
};

export default function BriefingCard() {
  const [prices, setPrices] = useState<Prices>({ btc: null, eth: null });
  const [weather, setWeather] = useState<Weather>(null);
  const [error, setError] = useState(false);
  const [updated, setUpdated] = useState<Date | null>(null);

  const loadPrices = async () => {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');
    const json = await res.json();
    setPrices({ btc: json.bitcoin.usd, eth: json.ethereum.usd });
    setUpdated(new Date());
    setError(false);
  };

  const loadWeather = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = loc.coords;
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`
    );
    const j = await res.json();
    setWeather({ tempC: j.current.temperature_2m, code: j.current.weather_code });
  };

  useEffect(() => {
    loadPrices().catch(() => setError(true));
    loadWeather().catch(() => {});
    const t = setInterval(() => loadPrices().catch(() => setError(true)), 60_000);
    return () => clearInterval(t);
  }, []);

  const fmt = (n: number | null) =>
    n == null ? '—' : '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Daily Briefing</Text>
      <Text style={styles.line}>🕐 {new Date().toLocaleTimeString()}</Text>
      <Text style={styles.line}>
        🌤 {weather ? `${WMO[weather.code] ?? 'Weather'} · ${weather.tempC}°C` : 'Weather: enable location'}
      </Text>
      <Text style={styles.line}>₿ BTC: {fmt(prices.btc)}   Ξ ETH: {fmt(prices.eth)}</Text>
      {error && <Text style={styles.warn}>Offline — showing last known prices</Text>}
      {updated && !error && <Text style={styles.updated}>Updated {updated.toLocaleTimeString()}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#141a2a', borderRadius: 14, padding: 16, marginBottom: 12 },
  heading: { color: '#f5f7fa', fontSize: 17, fontWeight: '600', marginBottom: 8 },
  line: { color: '#c3cad9', fontSize: 14, marginTop: 4 },
  warn: { color: '#e2b34b', fontSize: 12, marginTop: 8 },
  updated: { color: '#5f6678', fontSize: 11, marginTop: 8 },
});
