/**
 * Educational Alcor Bridge rules (pure TypeScript).
 *
 * Sources of truth for live behavior:
 *   https://docs.alcor.exchange/api/bridge
 *   https://telos.alcor.exchange/api/bridge/docs
 *
 * This module does not call the bridge API, does not sign, and does not
 * invent contract addresses beyond the documented account names.
 */

/** Payout destination chains for deposit-address API (`chain` field). */
export const PAYOUT_CHAINS = ["telos", "wax", "xpr", "vaulta"] as const;
export type PayoutChain = (typeof PAYOUT_CHAINS)[number];

/**
 * Networks a personal deposit address is documented to accept.
 * Docs warn: sending on any other EVM L2 (Arbitrum, Base, Tron, …) may lose funds.
 */
export const DEPOSIT_NETWORKS = [
  "mainnet", // Ethereum
  "bsc",
  "polygon",
  "sui",
  "near",
  "ton",
  "solana",
] as const;
export type DepositNetwork = (typeof DEPOSIT_NETWORKS)[number];

/** Explicit teaching refusals (not an exhaustive blocklist of all L2s). */
export const UNSUPPORTED_DEPOSIT_NETWORKS = [
  "arbitrum",
  "base",
  "tron",
  "optimism",
] as const;

/** Deposit-address memo: 1–64 of A–Z a–z 0–9 . _ - : */
export const DEPOSIT_MEMO_RE = /^[A-Za-z0-9._\-:]{1,64}$/;

/** Canonical bridged assets on Antelope sides are issued by wrap.alcor. */
export const WRAP_CONTRACT = "wrap.alcor";

/** Bridge payout / deposit counterparty account on Antelope chains. */
export const BRIDGE_ACCOUNT = "bridge.alcor";

/** Legacy WAX USDT (IBC era). Prefer wrap.alcor. */
export const LEGACY_USDT_CONTRACT = "usdt.alcor";

export type CreditSignal = {
  from: string;
  to: string;
  contract: string;
  symbol: string;
  memo: string;
  /** First receiver of the notify (token contract on Antelope). */
  firstReceiver: string;
};

export type CreditDecision =
  | { ok: true; userMemo: string; canonical: boolean }
  | { ok: false; reason: string };

export function isPayoutChain(s: string): s is PayoutChain {
  return (PAYOUT_CHAINS as readonly string[]).includes(s);
}

export function isDepositNetwork(s: string): s is DepositNetwork {
  return (DEPOSIT_NETWORKS as readonly string[]).includes(s);
}

export function isUnsupportedDepositNetwork(s: string): boolean {
  return (UNSUPPORTED_DEPOSIT_NETWORKS as readonly string[]).includes(
    s.toLowerCase(),
  );
}

/** Validate the optional memo passed to POST /v1/deposit-addresses. */
export function assertDepositMemo(memo: string | undefined | null): string | null {
  if (memo == null || memo === "") return null;
  if (typeof memo !== "string") throw new Error("memo must be a string");
  if (!DEPOSIT_MEMO_RE.test(memo)) throw new Error("bad deposit memo");
  return memo;
}

/**
 * Telos payout memos are `<your memo>|<network>:<deposit address>`.
 * Read the user memo only up to the first `|`.
 */
export function userMemoFromTelosPayout(memo: string): string {
  if (typeof memo !== "string") throw new Error("memo must be a string");
  const bar = memo.indexOf("|");
  return bar === -1 ? memo : memo.slice(0, bar);
}

/**
 * Decide whether an incoming Antelope transfer is a valid Alcor Bridge credit.
 * Memo is a routing tag, never authorization.
 */
export function decideBridgeCredit(
  chain: PayoutChain,
  expectedMemo: string | null,
  tx: CreditSignal,
): CreditDecision {
  if (!isPayoutChain(chain)) return { ok: false, reason: "bad payout chain" };
  if (tx.from !== BRIDGE_ACCOUNT) {
    return { ok: false, reason: "from is not bridge.alcor" };
  }
  if (tx.firstReceiver !== tx.contract) {
    return { ok: false, reason: "firstReceiver is not the token contract" };
  }

  const userMemo =
    chain === "telos" ? userMemoFromTelosPayout(tx.memo) : tx.memo;

  if (expectedMemo != null && userMemo !== expectedMemo) {
    return { ok: false, reason: "memo mismatch" };
  }

  // System coin may use the chain token contract; bridged assets use wrap.alcor.
  const bridgedSymbols = new Set([
    "USDC",
    "USDT",
    "ETH",
    "BNB",
    "POL",
    "SOL",
  ]);
  if (bridgedSymbols.has(tx.symbol.toUpperCase())) {
    if (tx.contract !== WRAP_CONTRACT) {
      return { ok: false, reason: "bridged asset must be wrap.alcor" };
    }
  }

  if (
    tx.symbol.toUpperCase() === "USDT" &&
    tx.contract === LEGACY_USDT_CONTRACT
  ) {
    return { ok: false, reason: "legacy usdt.alcor is not the bridge payout" };
  }

  return {
    ok: true,
    userMemo,
    canonical: tx.contract === WRAP_CONTRACT,
  };
}

/** Teaching: Telos is the hub. Two non-Telos legs still hop via Telos. */
export function routeHops(from: string, to: string): string[] {
  const a = from.toLowerCase();
  const b = to.toLowerCase();
  if (a === b) return [a];
  if (a === "telos") return ["telos", b];
  if (b === "telos") return [a, "telos"];
  return [a, "telos", b];
}

/** Gas forward is capped at 1% of the deposit (docs). Teaching integer bps. */
export function maxForwardFeeBps(): number {
  return 100; // 1%
}

export function feeWithinCap(amount: bigint, fee: bigint): boolean {
  if (amount <= 0n) throw new Error("amount must be positive");
  if (fee < 0n) throw new Error("fee must be non-negative");
  return fee * 10000n <= amount * BigInt(maxForwardFeeBps());
}
