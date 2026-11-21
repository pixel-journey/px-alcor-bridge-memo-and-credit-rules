# Education — Alcor Bridge credit rules

## Beginner

Alcor Bridge lets a user send USDT (or other listed assets) from Ethereum, BSC, Polygon, Sui, NEAR, TON, Solana, or another Antelope chain, and receive a payout on **Telos, WAX, XPR, or Vaulta**.

**Telos is the hub.** A trip from BSC to WAX still goes through Telos. The user usually signs once on the starting network.

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

## Masterclass (not in this repo)

- Live `POST https://telos.alcor.exchange/api/bridge/v1/deposit-addresses`
- SSE streams for pending → delivered
- EVM vault contracts and withdrawal release proofs
- Cross-chain **swap** (home page) that combines bridge + AMM in one user signature

Those are documented upstream. This lab only locks the pure checks an app must get right before it trusts a credit.
