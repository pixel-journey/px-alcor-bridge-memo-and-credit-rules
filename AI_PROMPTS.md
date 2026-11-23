# AI handoff — Alcor Bridge credit rules

## Agent tooling

```bash
git clone https://github.com/wharfkit/skill.git ~/.claude/skills/wharfkit
```

| Source | Role |
| --- | --- |
| [docs.alcor.exchange/api/bridge](https://docs.alcor.exchange/api/bridge) | Official bridge integration |
| [telos.alcor.exchange/api/bridge/docs](https://telos.alcor.exchange/api/bridge/docs) | Full field reference for agents |
| [Account factory](https://docs.alcor.exchange/developers-api/account-factory) | Memo forms, fees, refusals |
| [wharfkit/skill](https://github.com/wharfkit/skill) | SessionKit for Antelope legs (skill, not MCP) |
| [docs.alcor.exchange/for-projects](https://docs.alcor.exchange/for-projects) | Project matrix + llms.txt |
| Vault curriculum (private) | `px-contract-examples-vault` → `docs/ALCOR-BRIDGE.md` |

## Non-negotiables

1. Credit only when `from === bridge.alcor` and `firstReceiver ===` the expected token contract.
2. Bridged USDT/USDC path uses **`wrap.alcor`**, not `usdt.alcor`.
3. Deposit memo is 1–64 of `A-Za-z0-9._-:`. It identifies the user; it is **not** authorization.
4. On Telos, take the user memo **before** the first `|`.
5. Forward gas is capped at **100 bps** of the deposit amount (docs: no separate bridge fee).
6. Telos is the hub: `routeHops("bsc","wax")` → `["bsc","telos","wax"]`.
7. Factories: Telos `ac` (`.ac`), WAX `al` (`.al`), XPR `ac.alcor` (plain 4–12). Memo is `<account>:<owner>:<active>` or **108 digits**, or exactly `topup`.
8. Legacy **`EOS…` keys are refused** — convert to `PUB_K1_` first.
9. Under-fee: `quantity >= fee`. Live fee comes from the chain `fees` table — do not hardcode production fees from this lab.
10. This lab is pure; do not add network calls in an "upgrade".

## Prompt seeds

- "Show decideBridgeCredit for a WAX wrap.alcor USDT payout with memo user-42."
- "Parse `vasya.ac:PUB_K1_…:PUB_K1_…|tail` on Telos."
- "Refuse a 5-digit numeric factory memo."
- "Refuse legacy EOS… owner key."
- "quantity 1.99999999 vs fee 2.00000000 — covers fee?"
- "Refuse claiming live fees are pinned in this repo."

## Do not

- Treat memo as a signed claim.
- Fail the bridge transfer inside `on_notify`.
- Hardcode EVM vault addresses or live factory fees.
- Open a micro-repo for factory alone — extend this domain.
- Conflate this with orng.wax or AtomicAssets.
