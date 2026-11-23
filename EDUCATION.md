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

## Account factory (locked pure shape)

Factories create an account from **one transfer** ([docs](https://docs.alcor.exchange/developers-api/account-factory)):

| Chain | Contract | Name form |
| --- | --- | --- |
| Telos | `ac` | `<nick>.ac` |
| WAX | `al` | `<nick>.al` |
| XPR | `ac.alcor` | plain 4–12 chars |

Memo forms this lab parses:

- Text: `<account>:<owner key>:<active key>` (tail after `|` ignored)
- Exactly **108 digits** (exchange-safe form)
- Exactly `topup` (refills factory reserve; creates nothing)

Refused: missing suffix, dotted nick, legacy `EOS…` keys, numeric memo ≠ 108 digits.

Under-fee: `depositCoversFactoryFee(quantity, fee)` requires `quantity >= fee`. **Fee is an argument** — production code must read the live `fees` table; sample numbers in tests are not market truth.

Not locked here: base58 checksum, `get_account` name free, live fee rows, deposit-address `leg` hashing.

## Host checklist (when leaving pure lab)

1. `POST https://telos.alcor.exchange/api/bridge/v1/deposit-addresses` with `chain`, `to`, optional `memo` (or `leg` for factory).
2. Show only networks listed for that address — not Arbitrum / Base / Tron unless listed.
3. Display live `least` minimum from the response; do not hardcode.
4. Watch history / Hyperion / SessionKit for transfer from **`bridge.alcor`**.
5. Credit only after memo match + contract checks; never treat memo as authorization.
6. Prefer [WharfKit skill](https://github.com/wharfkit/skill) for Antelope legs.
7. Market prices are a different surface (Alcor **v3** market APIs) — not this lab.

## Memo contrast

| Product | Memo role |
| --- | --- |
| Bridge deposit address | Routing tag to tell users apart |
| Account factory | Nick + keys (or 108 digits) / `topup` |
| [px-memo-action-router](https://github.com/pixel-journey/px-memo-action-router) | `action` / `action:payload` grammar for dapp routing |
| ORNG stake top-up | Teaching memos `deposit` / `stake` — different product |

Never use any of these memo strings as an **inline action name**.

## Masterclass (not in this repo)

- Live `POST` deposit-addresses and factory `leg`
- SSE streams for pending → delivered
- EVM vault contracts and withdrawal release proofs
- Base58 checksum and on-chain fee table reads
- Cross-chain **swap** (home page) that combines bridge + AMM in one user signature

Curriculum index (private vault): `px-contract-examples-vault` → `docs/ALCOR-BRIDGE.md`.
