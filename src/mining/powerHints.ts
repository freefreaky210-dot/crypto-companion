import * as Location from 'expo-location';

// Cheap-power window hints: generic off-peak (23:00-06:00) + solar sunshine forecast.
// Uses open-meteo daily sunshine_duration (no API key).
export type PowerHint = { title: string; detail: string };

export async function getPowerHints(): Promise<PowerHint[]> {
  const hints: PowerHint[] = [];

  // Generic off-peak (user's local time)
  const h = new Date().getHours();
  hints.push(h >= 23 || h < 6
    ? { title: '⚡ Off-peak NOW', detail: 'You are inside the 23:00–06:00 off-peak window — cheapest typical grid power. Good time to run rigs.' }
    : { title: '⚡ Off-peak tonight', detail: 'Typical cheap-power window is 23:00–06:00. Consider scheduling rigs for overnight.' });

  // Solar forecast (tomorrow's sunshine hours)
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({});
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${loc.coords.latitude}&longitude=${loc.coords.longitude}&daily=sunshine_duration&forecast_days=2`
      );
      const j = await res.json();
      const secs: number = j.daily?.sunshine_duration?.[1] ?? 0;
      const hours = secs / 3600;
      hints.push(hours >= 6
        ? { title: '☀️ Sunny tomorrow', detail: `~${hours.toFixed(1)}h of sunshine forecast — great solar mining day tomorrow.` }
        : { title: '☁️ Low sun tomorrow', detail: `Only ~${hours.toFixed(1)}h sunshine forecast — solar mining yield will be limited.` });
    }
  } catch { /* weather hint optional */ }

  return hints;
}
