# Sources

| Source | Use |
| --- | --- |
| [Bridge API](https://docs.alcor.exchange/api/bridge) | Deposit addresses, streams, contracts overview |
| [Bridge API /docs](https://telos.alcor.exchange/api/bridge/docs) | Full agent-oriented reference |
| [OpenAPI](https://telos.alcor.exchange/api/bridge/openapi.yaml) | Machine schema |
| [Account factory](https://docs.alcor.exchange/developers-api/account-factory) | Memo forms, fees table, refusals |
| [for-projects](https://docs.alcor.exchange/for-projects) | Deposit / factory / llms.txt entry |
| [USDT on WAX](https://docs.alcor.exchange/alcor-usdt-proxy) | `USDT@wrap.alcor` vs legacy `USDT@usdt.alcor` |
| [Alcor API index](https://docs.alcor.exchange/api) | v2 still hosted; v3 for market data |
| [wharfkit/skill](https://github.com/wharfkit/skill) | SessionKit if a host signs Antelope legs |

## Product facts locked by tests

- Deposit memo charset and length.
- Credit requires `from === bridge.alcor` and `firstReceiver === contract`.
- Bridged USDT path requires `wrap.alcor`, not `usdt.alcor`.
- Telos user memo is the prefix before `|`.
- `routeHops("bsc","wax")` → `["bsc","telos","wax"]`.
- Forward fee ≤ 100 bps of amount.
- Unsupported teaching networks: arbitrum, base, tron, optimism.
- Factory contracts: `ac` / `al` / `ac.alcor`.
- Factory memo: text triple, 108 digits, or `topup`; tail after `|` ignored.
- Legacy `EOS…` keys refused; `PUB_K1_` / `PUB_R1_` / `PUB_WA_` prefixes only (checksum not verified here).
- Under-fee: quantity must be ≥ fee (fee argument is caller-supplied).

Live mins, maxes, fees, and addresses change. Re-read the API and `fees` table; do not pin them in this repo.

## Suggested GitHub topics

`antelope` `education` `pixel-journey` `alcor` `bridge` `cross-chain`
