/**
 * Educational Alcor Bridge rules (pure TypeScript).
 *
 * Sources of truth for live behavior:
 *   https://docs.alcor.exchange/api/bridge
 *   https://telos.alcor.exchange/api/bridge/docs
 *   https://docs.alcor.exchange/developers-api/account-factory
 *
 * This module does not call the bridge API, does not sign, and does not
 * invent contract addresses beyond the documented account names.
 * Live fees change — always re-read the chain `fees` table before sending.
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

/**
 * Account factories (official docs). Same contract shape per network.
 * Fees change — teaching constants below are samples, not market truth.
 */
export const FACTORY_BY_CHAIN = {
  telos: { contract: "ac", suffix: ".ac", minNick: 1, maxNick: 9 },
  wax: { contract: "al", suffix: ".al", minNick: 1, maxNick: 9 },
  xpr: { contract: "ac.alcor", suffix: "", minNick: 4, maxNick: 12 },
} as const;

export type FactoryChain = keyof typeof FACTORY_BY_CHAIN;

/** a-z and 1-5 only (Antelope name charset for the nick). */
const NICK_RE = /^[a-z1-5]+$/;

/** Modern public-key prefixes the factory accepts. Legacy EOS… is refused. */
const KEY_PREFIX_RE = /^PUB_(K1|R1|WA)_/;

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

export type FactoryMemoParse =
  | { kind: "topup" }
  | { kind: "numeric"; digits: string }
  | {
      kind: "text";
      account: string;
      ownerKey: string;
      activeKey: string;
    };

export type FactoryMemoDecision =
  | { ok: true; parsed: FactoryMemoParse }
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

export function isFactoryChain(s: string): s is FactoryChain {
  return Object.prototype.hasOwnProperty.call(FACTORY_BY_CHAIN, s);
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

/**
 * Parse an account-factory memo (text or 108-digit form).
 * Anything after the first `|` is ignored (docs).
 * Does not verify base58 checksums or on-chain name availability.
 */
export function parseFactoryMemo(
  chain: FactoryChain,
  rawMemo: string,
): FactoryMemoDecision {
  if (!isFactoryChain(chain)) return { ok: false, reason: "bad factory chain" };
  if (typeof rawMemo !== "string") {
    return { ok: false, reason: "memo must be a string" };
  }

  const memo = rawMemo.includes("|")
    ? rawMemo.slice(0, rawMemo.indexOf("|"))
    : rawMemo;

  if (memo === "topup") return { ok: true, parsed: { kind: "topup" } };

  if (/^\d+$/.test(memo)) {
    if (memo.length !== 108) {
      return { ok: false, reason: "numeric memo must be 108 digits" };
    }
    return { ok: true, parsed: { kind: "numeric", digits: memo } };
  }

  const parts = memo.split(":");
  if (parts.length < 3) {
    return {
      ok: false,
      reason: "memo must be <account>:<owner key>:<active key>",
    };
  }
  const [account, ownerKey, activeKey] = parts;
  if (!account || !ownerKey || !activeKey) {
    return {
      ok: false,
      reason: "memo must be <account>:<owner key>:<active key>",
    };
  }

  const cfg = FACTORY_BY_CHAIN[chain];
  if (account.length > 12) {
    return { ok: false, reason: "account name is longer than 12 characters" };
  }

  if (cfg.suffix) {
    if (!account.endsWith(cfg.suffix)) {
      return {
        ok: false,
        reason: `account name must end with ${cfg.suffix}`,
      };
    }
    const nick = account.slice(0, -cfg.suffix.length);
    if (nick.includes(".")) {
      return { ok: false, reason: "nick cannot contain a dot" };
    }
    if (
      nick.length < cfg.minNick ||
      nick.length > cfg.maxNick ||
      !NICK_RE.test(nick)
    ) {
      return { ok: false, reason: "nick has bad length or charset" };
    }
  } else {
    if (account.includes(".")) {
      return { ok: false, reason: "nick cannot contain a dot" };
    }
    if (
      account.length < cfg.minNick ||
      account.length > cfg.maxNick ||
      !NICK_RE.test(account)
    ) {
      return { ok: false, reason: "nick has bad length or charset" };
    }
  }

  for (const key of [ownerKey, activeKey]) {
    if (key.startsWith("EOS")) {
      return {
        ok: false,
        reason: "legacy EOS… key refused; convert to PUB_K1_",
      };
    }
    if (!KEY_PREFIX_RE.test(key)) {
      return {
        ok: false,
        reason: "key must be PUB_K1_, PUB_R1_ or PUB_WA_",
      };
    }
  }

  return {
    ok: true,
    parsed: { kind: "text", account, ownerKey, activeKey },
  };
}

/**
 * Teaching under-fee gate. `fee` must come from the live `fees` table in production.
 * Quantity must be at least the fee; the remainder lands on the new account.
 */
export function depositCoversFactoryFee(
  quantity: bigint,
  fee: bigint,
): boolean {
  if (quantity < 0n) throw new Error("quantity must be non-negative");
  if (fee < 0n) throw new Error("fee must be non-negative");
  return quantity >= fee;
}

/**
 * Amount that lands on the new account after the factory fee.
 * Returns null when the deposit does not cover the fee (nothing is created).
 */
export function factoryRemainderAfterFee(
  quantity: bigint,
  fee: bigint,
): bigint | null {
  if (!depositCoversFactoryFee(quantity, fee)) return null;
  return quantity - fee;
}
