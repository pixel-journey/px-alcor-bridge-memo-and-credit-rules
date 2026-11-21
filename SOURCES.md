# Sources

| Source | Use |
| --- | --- |
| [Bridge API](https://docs.alcor.exchange/api/bridge) | Deposit addresses, streams, contracts overview |
| [Bridge API /docs](https://telos.alcor.exchange/api/bridge/docs) | Full agent-oriented reference |
| [Bridge /docs/bot](https://telos.alcor.exchange/api/bridge/docs/bot) | Signing on each chain |
| [OpenAPI](https://telos.alcor.exchange/api/bridge/openapi.yaml) | Machine schema |
| [Bridge product page](https://docs.alcor.exchange/main-page-overview/bridge) | Hub model, timing table |
| [Deposit and Withdraw](https://docs.alcor.exchange/main-page-overview/deposit-and-withdraw) | Exchange deposit UX |
| [USDT on WAX](https://docs.alcor.exchange/alcor-usdt-proxy) | `USDT@wrap.alcor` vs legacy `USDT@usdt.alcor` |
| [Alcor API index](https://docs.alcor.exchange/api) | v2 still hosted; v3 for market data |
| [Market Feed v3](https://docs.alcor.exchange/api/feed) | Cross-chain feed shape (not used by this lab) |
| [Analytics v3](https://docs.alcor.exchange/api/analytics) | TVL / volume lists (not used by this lab) |
| [wharfkit/skill](https://github.com/wharfkit/skill) | SessionKit if a host signs Antelope legs |
| [atomic-knowledge](https://github.com/atomicassets/atomic-knowledge) | Boundary: NFT product, not bridge |

## Product facts locked by tests

- Deposit memo charset and length.
- Credit requires `from === bridge.alcor` and `firstReceiver === contract`.
- Bridged USDT path requires `wrap.alcor`, not `usdt.alcor`.
- Telos user memo is the prefix before `|`.
- `routeHops("bsc","wax")` → `["bsc","telos","wax"]`.
- Forward fee ≤ 100 bps of amount.

Live mins, maxes, and addresses change. Re-read the API; do not pin them in this repo.

## Suggested GitHub topics

`antelope` `education` `pixel-journey` `alcor` `bridge` `cross-chain`
