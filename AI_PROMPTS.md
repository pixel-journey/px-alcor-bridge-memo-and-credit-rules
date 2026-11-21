# AI handoff — Alcor Bridge credit rules

## Agent tooling

```bash
git clone https://github.com/wharfkit/skill.git ~/.claude/skills/wharfkit
```

| Source | Role |
| --- | --- |
| [docs.alcor.exchange/api/bridge](https://docs.alcor.exchange/api/bridge) | Official bridge integration |
| [telos.alcor.exchange/api/bridge/docs](https://telos.alcor.exchange/api/bridge/docs) | Full field reference for agents |
| [wharfkit/skill](https://github.com/wharfkit/skill) | SessionKit for Antelope legs |
| [atomic-knowledge](https://github.com/atomicassets/atomic-knowledge) | NFT work is a different product — do not mix |

## Non-negotiables

1. Credit only when `from === bridge.alcor` and `firstReceiver ===` the expected token contract.
2. Bridged USDT/USDC path uses **`wrap.alcor`**, not `usdt.alcor`.
3. Deposit memo is 1–64 of `A-Za-z0-9._-:`. It identifies the user; it is **not** authorization.
4. On Telos, take the user memo **before** the first `|`.
5. Do not invent vault addresses or live mins/maxes — read the API.
6. Do not tell the user to deposit on Arbitrum/Base/Tron for an ETH/BSC/Polygon address.
7. This lab is pure; do not add network calls in a "upgrade".

## Prompt seeds

- "Show decideBridgeCredit for a WAX wrap.alcor USDT payout with memo user-42."
- "Parse a Telos memo `user-42|bsc:0xabc` and credit the right user."
- "Refuse a legacy usdt.alcor transfer that claims to be a bridge deposit."
- "Explain Telos hub hops for BSC → WAX without calling the API."
- "Draft a host checklist: deposit-addresses → show QR → credit on transfer from bridge.alcor."

## Do not

- Treat memo as a signed claim.
- Fail the bridge transfer inside `on_notify`.
- Hardcode EVM vault addresses from a Medium post.
- Conflate this with orng.wax or AtomicAssets.
