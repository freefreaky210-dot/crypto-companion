# Crypto Companion

Self-custodial multi-coin crypto wallet with daily context (time, weather, prices).

**Status:** Phase 1 planning/scaffolding. See [SPEC.md](SPEC.md) for the full product spec (v1.5).

## Principles
- Self-custodial: keys never leave the device
- Security first: PIN/biometric on every send, audited libraries only, testnet-first
- Open source (MIT)
- Small launch scope: BTC + ETH only, no AI/voice until Phase 4

## Tech Stack (planned)
- React Native (iOS + Android from one codebase)
- Bitcoin: BDK (Bitcoin Dev Kit)
- Ethereum: ethers.js
- Data: Esplora/mempool.space, Ethereum RPC, CoinGecko, OpenWeather

## Repo Layout
- `SPEC.md` — Phase 1 product spec
- `docs/` — design and decision docs
- `src/wallet/` — key management, send/receive (M1–M2)
- `src/chains/` — per-chain adapters (bitcoin, ethereum)
- `src/ui/` — dashboard, briefing card (M3–M4)
- `docs/milestones.md` — M1–M5 breakdown (tracked as GitHub issues)

## Getting Started
Scaffold only — no runnable app yet. Clone, then pick up issue M1.
