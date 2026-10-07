# Wallet module (M1-M2)

Responsibilities:
- BIP39 seed generation + backup confirmation flow
- Import (seed / xpub watch-only)
- Secure enclave key storage
- Send flow: review -> PIN/biometric confirm -> broadcast

Rules: keys never leave device; no hand-rolled crypto; audited libs only.
