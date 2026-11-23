# px-alcor-bridge-memo-and-credit-rules

Educational pure TypeScript for **Alcor Bridge** integration patterns:

- deposit-address **memo** shape (1–64 of `A-Za-z0-9._-:`)
- **credit** only on a transfer from `bridge.alcor` with the expected memo
- **Telos** payout memo: read only up to the first `|`
- **wrap.alcor** vs legacy `usdt.alcor`
- **Telos hub** route hops
- forward fee ceiling **≤ 1%**
- **account factory** memo parse (`ac` / `al` / `ac.alcor`): text form, 108-digit form, `topup`, legacy `EOS…` key refused
- under-fee gate: quantity must be ≥ fee (fee from live table in production)

```bash
npm test
```

This is **not** a live bridge client. It does not call `POST /v1/deposit-addresses`, does not sign, does not verify base58 checksums, and does not invent vault addresses. Live API: [docs.alcor.exchange/api/bridge](https://docs.alcor.exchange/api/bridge). Factory: [account-factory](https://docs.alcor.exchange/developers-api/account-factory).

Curriculum index (private vault): `px-contract-examples-vault` → `docs/ALCOR-BRIDGE.md`.

Prefer [WharfKit SessionKit skill](https://github.com/wharfkit/skill) if a host later signs Antelope legs. Market data (v2 still hosted; v3 recommended for new reads) is a different surface — see [ALCOR-API-AND-BRIDGE.md](https://github.com/pixel-journey/pixel-journey-standards/blob/main/standards/quality-gates/ALCOR-API-AND-BRIDGE.md). Order-book accounts are not the same on every chain: WAX `alcordexmain`, EOS and Telos `eostokensdex`, XPR `alcor`. This lab does not read those tables.

Topics: `antelope` `education` `pixel-journey` `alcor` `bridge` `cross-chain`
