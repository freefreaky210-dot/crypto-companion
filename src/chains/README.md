# Chain adapters

- bitcoin/ -> BDK (Bitcoin Dev Kit), Esplora backend, testnet-first
- ethereum/ -> ethers.js, RPC via Alchemy/Infura or self-hosted, Sepolia-first

One adapter interface: getBalance, getHistory, buildTx, broadcastTx, estimateFee.
