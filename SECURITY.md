# Security — bridge credit rules

## Closed in tests

| Rule | Behavior |
| --- | --- |
| Deposit memo | 1–64 of `A-Za-z0-9._-:`; empty → null |
| Credit `from` | must be `bridge.alcor` |
| `firstReceiver` | must equal the token contract |
| Bridged USDT/USDC/… | contract must be `wrap.alcor` |
| Legacy `usdt.alcor` | refused as bridge payout |
| Telos memo | user id is the prefix before the first `|` |
| Route hops | non-Telos ↔ non-Telos inserts `telos` |
| Forward fee | `fee * 10000 ≤ amount * 100` (≤ 1%) |

## Not closed (production)

| Concern | Guidance |
| --- | --- |
| Live routes / min / max | Read `GET /v1/routes` and `least` from the deposit-address response |
| Vault / withdraw contract addresses | Read `GET /v1/chains`; do not hardcode from a blog post |
| EVM deposit signing | Official bridge bot docs — not this lab |
| Memo as auth | **Never.** Memo is a routing tag to tell users apart |
| Wrong network deposit | Docs: Arbitrum / Base / Tron may lose funds |

## Attack angles

1. Crediting a fake notify that is not from `bridge.alcor`.  
2. Crediting a transfer of a look-alike token on another contract.  
3. Treating the deposit-address memo as a signed claim.  
4. Showing an Arbitrum QR for an Ethereum-only address.  
5. Refusing the bridge payout in a contract `on_notify` (returned to the deposit address / held).

## Honesty limits

No network. No wasm. No private keys. No deposit address is generated here.
