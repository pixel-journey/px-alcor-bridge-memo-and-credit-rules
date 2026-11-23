# Education — Alcor Bridge credit rules

## Beginner

Alcor Bridge lets a user send USDT (or other listed assets) from Ethereum, BSC, Polygon, Sui, NEAR, TON, Solana, or another Antelope chain, and receive a payout on **Telos, WAX, XPR, or Vaulta**.

**Telos is the hub.** A trip from BSC to WAX still goes through Telos. The user usually signs once on the starting network. `hop.alcor` on Telos carries some hub legs; apps that only **receive** on WAX still credit a transfer from `bridge.alcor` to their account.

For apps, the usual pattern is:

1. Ask the bridge for a **deposit address** for your account and a **memo** that identifies the user (`user-42`).
2. Show the user that address and the networks it accepts.
3. When a transfer from `bridge.alcor` lands on your account with that memo, **credit the user**.

There is no webhook. The on-chain transfer **is** the signal.

## Intermediate

On WAX / XPR / Vaulta the payout memo is exactly the memo you registered.

On Telos the memo is `yourMemo|network:depositAddress`. Keep only the part before the first `|`.

Bridged USDT/USDC/ETH/BNB/POL/SOL on those chains come from **`wrap.alcor`**. The older WAX token `USDT@usdt.alcor` is a different asset (legacy IBC). Do not credit it as a modern bridge deposit.

Anyone can notify your contract of a transfer of a fake token. Check:

- first receiver is the token contract you expect
- `from` is `bridge.alcor`

Never fail the bridge transfer in `on_notify`: a refused payout goes back to the deposit address and waits for support.

## Host checklist (when leaving pure lab)

1. `POST https://telos.alcor.exchange/api/bridge/v1/deposit-addresses` with `chain`, `to`, optional `memo`.
2. Show only networks listed for that address — not Arbitrum / Base / Tron unless listed.
3. Display live `least` minimum from the response; do not hardcode.
4. Watch history / Hyperion / SessionKit for transfer from **`bridge.alcor`**.
5. Credit only after memo match + contract checks; never treat memo as authorization.
6. Prefer [WharfKit skill](https://github.com/wharfkit/skill) for Antelope legs.
7. Market prices are a different surface (Alcor **v3** market APIs) — not this lab.

## Account factory (not locked in this repo)

Alcor also documents **account factories** (`ac` on Telos, `al` on WAX, `ac.alcor` on XPR) that create an account from one transfer, including bridged tokens via deposit addresses. That is a separate product surface ([Account factory](https://docs.alcor.exchange/developers-api/account-factory)). This lab does **not** parse factory memos or under-fee deposits. Do not invent those tests here without a new pure rule.

## Memo contrast

| Product | Memo role |
| --- | --- |
| This bridge lab | Routing tag to tell users apart |
| [px-memo-action-router](https://github.com/pixel-journey/px-memo-action-router) | `action` / `action:payload` grammar for dapp routing |
| ORNG stake top-up | Teaching memos `deposit` / `stake` — different product |
| Account factory | Nick + keys (or digit form) as deposit / `leg` memo — upstream docs |

Never use any of these memo strings as an **inline action name**.

## Masterclass (not in this repo)

- Live `POST https://telos.alcor.exchange/api/bridge/v1/deposit-addresses`
- SSE streams for pending → delivered
- EVM vault contracts and withdrawal release proofs
- Account factory create-from-deposit
- Cross-chain **swap** (home page) that combines bridge + AMM in one user signature

Those are documented upstream. This lab only locks the pure checks an app must get right before it trusts a credit.

Curriculum index (private vault): `px-contract-examples-vault` → `docs/ALCOR-BRIDGE.md`.
