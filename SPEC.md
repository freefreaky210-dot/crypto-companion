# Crypto Companion — Phase 1 Spec (v1.5)

**Status:** Draft v1.5 — October 7, 2026 — *multi-coin support added; AI assistant and voice deferred to Phase 4*
**Goal:** A self-custodial multi-coin crypto wallet — real keys, real sends — done safely.

## 1. Vision
One solid multi-coin wallet: create or import wallets, hold your own keys, send/receive crypto, with daily context (time, weather, prices).

## 2. Phase 1 Scope (IN)
- **Multi-coin support (launch set — keep small):**
  - Bitcoin (on-chain)
  - Ethereum (+ optional USDT/USDC as ERC-20)
  - Rule: max 2–3 chains at launch; each new chain multiplies testing/audit cost
- **Full self-custodial wallet:**
  - Create new wallet (BIP39 seed, shown once, user-confirmed backup)
  - Import existing wallet (seed phrase / xpub watch-only option)
  - One seed derives keys for all supported chains (BIP44)
  - Keys on-device only (secure enclave/keystore, encrypted at rest)
- **Send & Receive (per coin):**
  - Receive: address + QR
  - Send: address/QR/contact, amount in crypto/fiat, fee selector
  - Mandatory PIN/biometric confirmation on every send + review screen
  - Optional per-transaction and daily spend limits
- **Dashboard:** Per-coin balances + combined fiat total, prices, recent transactions
- **Daily briefing card (visual):** Time, weather, prices, balance change
- **Weather-aware mining hints**

## 3. Phase 1 Scope (OUT)
- AI assistant (Phase 4)
- Lightning channel management (Phase 3)
- Voice/audio (Phase 4)
- Swaps/trading, staking, DeFi, NFTs (later phases)

## 4. Architecture
```
Mobile app (React Native or Flutter)
├─ Wallet cores (per chain, audited libs only):
│   ├─ Bitcoin → BDK (Bitcoin Dev Kit)
│   └─ Ethereum → ethers.js / web3 (audited mobile bindings)
├─ Key storage: single BIP39 seed → BIP44 derivation, secure enclave, never transmitted
└─ Data sources: Esplora/mempool.space (BTC), Ethereum RPC (Alchemy/Infura or self-hosted),
    price feeds (CoinGecko), weather API
```

## 5. Security Rules (non-negotiable)
1. Keys never leave the device — no cloud backup of seeds
2. Seed backup flow with confirmation quiz (can't skip)
3. PIN/biometric on every send — no exceptions
4. Send flow: review → confirm → broadcast (two-step, always)
5. Audited libraries only; security audit before real-money launch
6. Open-source from day one
7. Testnet-first (Bitcoin testnet + Ethereum Sepolia) — no mainnet until audit passes

## 6. Milestones
- **M1:** Wallet create/import + key storage + receive (BTC + ETH)
- **M2:** Send flows with PIN/biometric + fee selectors + spend limits
- **M3:** Multi-coin dashboard + combined fiat totals + history
- **M4:** Daily briefing card + notifications + mining hints
- **M5:** Testnet beta → security audit → mainnet release

## 7. Success Criteria
- User can create wallet, back up seed, receive and send testnet BTC and ETH end-to-end
- Every send requires explicit biometric/PIN confirm
- Zero key material ever leaves device
- App fully usable (cached) offline

## 8. Addendum
- **Onboarding:** QR scan + paste import; per-wallet "where do I find this?" guides; xpub privacy warning
- **Multi-wallet:** multiple spendable wallets with separate keys; combined total view + per-wallet toggle
- **Fiat display:** crypto + user-selected fiat (USD, EUR, etc.), locale default
- **Offline/error handling:** cached data with "last updated" timestamp; secondary explorer fallback; no blank states
- **Privacy:** disclose explorer API address leak; optional own Esplora instance + Tor toggle; local cache encryption; user data wipe

## 9. Next Phases
- **Phase 2:** Contact list, recurring payments, coin control, multisig, token expansion
- **Phase 3:** Lightning + mining rig integration
- **Phase 4:** AI assistant (text Q&A) + voice/audio layer
