# Crypto Companion

Self-custodial multi-coin crypto wallet with daily context (time, weather, prices).

**Status:** Phase 1 — runnable Expo skeleton. See [SPEC.md](SPEC.md) for the full product spec (v1.5).

## Run on PC + phone (Expo Go)
1. Install **Expo Go** on your phone (Play Store / App Store)
2. On your PC:
```bash
git clone git@github.com:freefreaky210-dot/crypto-companion.git
cd crypto-companion
npm install
npx expo start
```
3. Scan the QR code with Expo Go (phone + PC on the same Wi-Fi)

## Build an APK (install like a real app) — later
Requires a free Expo account (https://expo.dev):
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```
This produces an `.apk` (profile `preview` in eas.json) you can install directly on Android.

## Principles
- Self-custodial: keys never leave the device
- Security first: PIN/biometric on every send, audited libraries only, testnet-first
- Open source (MIT)
- Small launch scope: BTC + ETH only, no AI/voice until Phase 4

## Tech Stack (planned)
- React Native (Expo)
- Bitcoin: BDK (Bitcoin Dev Kit)
- Ethereum: ethers.js
- Data: Esplora/mempool.space, Ethereum RPC, CoinGecko, OpenWeather

## Repo Layout
- `SPEC.md` — Phase 1 product spec
- `docs/` — design and decision docs
- `src/wallet/` — key management, send/receive (M1–M2)
- `src/chains/` — per-chain adapters (bitcoin, ethereum)
- `src/ui/` — dashboard, briefing card, chat box (M3–M4)
- `docs/milestones.md` — M1–M5 breakdown (tracked as GitHub issues)
