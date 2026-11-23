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
| Factory memo | text triple / 108 digits / `topup`; suffix and nick rules |
| Legacy `EOS…` key | refused |
| Under-fee | `quantity >= fee` |

## Not closed (production)

| Concern | Guidance |
| --- | --- |
| Live routes / min / max / fees | Read API + chain `fees` table |
| Base58 key checksum | Official factory verifies; this lab only checks prefix |
| Name availability | `get_account` must fail before create |
| Vault / withdraw addresses | `GET /v1/chains`; do not hardcode |
| Memo as auth | **Never.** Routing tag only |
| Wrong network deposit | Arbitrum / Base / Tron may lose funds |

## Attack angles

1. Crediting a fake notify that is not from `bridge.alcor`.  
2. Crediting a look-alike token on another contract.  
3. Treating the deposit-address or factory memo as a signed claim.  
4. Showing an Arbitrum QR for an Ethereum-only address.  
5. Shipping private keys in a factory memo prompt.  
6. Hardcoding a sample fee as market truth.

## Honesty limits

No network. No wasm. No private keys. No deposit address is generated here.
