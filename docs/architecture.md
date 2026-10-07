# Architecture (SPEC.md v1.5)

Mobile app (React Native)
- Wallet cores (audited libs only): Bitcoin -> BDK, Ethereum -> ethers.js
- Key storage: single BIP39 seed -> BIP44 derivation, secure enclave, never transmitted
- Data sources: Esplora/mempool.space (BTC), Ethereum RPC, CoinGecko, OpenWeather
