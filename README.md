# px-alcor-bridge-memo-and-credit-rules

Educational pure TypeScript for **Alcor Bridge** integration patterns:

- deposit-address **memo** shape (1–64 of `A-Za-z0-9._-:`)
- **credit** only on a transfer from `bridge.alcor` with the expected memo
- **Telos** payout memo: read only up to the first `|`
- **wrap.alcor** vs legacy `usdt.alcor`
- **Telos hub** route hops
- forward fee ceiling **≤ 1%**

```bash
npm test
```

This is **not** a live bridge client. It does not call `POST /v1/deposit-addresses`, does not sign, and does not invent vault addresses. Live API: [docs.alcor.exchange/api/bridge](https://docs.alcor.exchange/api/bridge). Agent-oriented reference: [telos.alcor.exchange/api/bridge/docs](https://telos.alcor.exchange/api/bridge/docs).

Curriculum index (private vault): `px-contract-examples-vault` → `docs/ALCOR-BRIDGE.md`.

Prefer [WharfKit SessionKit skill](https://github.com/wharfkit/skill) if a host later signs Antelope legs. Prefer official bridge docs for EVM / Sui / NEAR / TON / Solana deposit addresses. Market data (v2 still hosted; v3 recommended for new reads) is a different surface — see vault `docs/ALCOR-API.md`.

**Topics (when empty):** `antelope` `education` `pixel-journey` `alcor` `bridge` `cross-chain`
