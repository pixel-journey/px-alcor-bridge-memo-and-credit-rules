import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertDepositMemo,
  decideBridgeCredit,
  depositCoversFactoryFee,
  feeWithinCap,
  isUnsupportedDepositNetwork,
  parseFactoryMemo,
  routeHops,
  userMemoFromTelosPayout,
  WRAP_CONTRACT,
  BRIDGE_ACCOUNT,
  LEGACY_USDT_CONTRACT,
  FACTORY_BY_CHAIN,
} from "./bridge.ts";

describe("assertDepositMemo", () => {
  it("accepts nullish and valid memos", () => {
    assert.equal(assertDepositMemo(null), null);
    assert.equal(assertDepositMemo(""), null);
    assert.equal(assertDepositMemo("user-42"), "user-42");
    assert.equal(assertDepositMemo("a:b_c.1"), "a:b_c.1");
  });

  it("refuses bad memos", () => {
    assert.throws(() => assertDepositMemo("has space"), /bad deposit memo/);
    assert.throws(() => assertDepositMemo("x".repeat(65)), /bad deposit memo/);
  });
});

describe("userMemoFromTelosPayout", () => {
  it("cuts at the first bar", () => {
    assert.equal(
      userMemoFromTelosPayout("user-42|bsc:0xabc"),
      "user-42",
    );
    assert.equal(userMemoFromTelosPayout("only"), "only");
  });
});

describe("decideBridgeCredit", () => {
  const base = {
    from: BRIDGE_ACCOUNT,
    to: "yourproject",
    contract: WRAP_CONTRACT,
    symbol: "USDT",
    memo: "user-42",
    firstReceiver: WRAP_CONTRACT,
  };

  it("credits a WAX wrap.alcor payout with matching memo", () => {
    const d = decideBridgeCredit("wax", "user-42", base);
    assert.equal(d.ok, true);
    if (d.ok) {
      assert.equal(d.userMemo, "user-42");
      assert.equal(d.canonical, true);
    }
  });

  it("reads Telos memo only up to the bar", () => {
    const d = decideBridgeCredit("telos", "user-42", {
      ...base,
      memo: "user-42|bsc:0xdep",
    });
    assert.equal(d.ok, true);
    if (d.ok) assert.equal(d.userMemo, "user-42");
  });

  it("refuses wrong from, wrong firstReceiver, legacy USDT, memo mismatch", () => {
    assert.equal(
      decideBridgeCredit("wax", "user-42", { ...base, from: "alice" }).ok,
      false,
    );
    assert.equal(
      decideBridgeCredit("wax", "user-42", {
        ...base,
        firstReceiver: "eosio.token",
      }).ok,
      false,
    );
    assert.equal(
      decideBridgeCredit("wax", "user-42", {
        ...base,
        contract: LEGACY_USDT_CONTRACT,
        firstReceiver: LEGACY_USDT_CONTRACT,
      }).ok,
      false,
    );
    assert.equal(
      decideBridgeCredit("wax", "user-42", { ...base, memo: "other" }).ok,
      false,
    );
  });
});

describe("routeHops", () => {
  it("uses Telos as hub", () => {
    assert.deepEqual(routeHops("bsc", "wax"), ["bsc", "telos", "wax"]);
    assert.deepEqual(routeHops("wax", "telos"), ["wax", "telos"]);
    assert.deepEqual(routeHops("telos", "near"), ["telos", "near"]);
    assert.deepEqual(routeHops("wax", "wax"), ["wax"]);
  });
});

describe("unsupported networks and fee cap", () => {
  it("flags common wrong networks", () => {
    assert.equal(isUnsupportedDepositNetwork("arbitrum"), true);
    assert.equal(isUnsupportedDepositNetwork("base"), true);
    assert.equal(isUnsupportedDepositNetwork("bsc"), false);
  });

  it("enforces the 1% forward fee ceiling", () => {
    assert.equal(feeWithinCap(10_000n, 100n), true);
    assert.equal(feeWithinCap(10_000n, 101n), false);
    assert.throws(() => feeWithinCap(0n, 0n), /positive/);
  });
});

describe("parseFactoryMemo", () => {
  const k1 =
    "PUB_K1_6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV";
  const k1b =
    "PUB_K1_5b3z7Y1q9exampleActiveKeyForTeachingOnlyxxxxxx";

  it("parses Telos text form and strips tail after |", () => {
    const d = parseFactoryMemo(
      "telos",
      `vasya.ac:${k1}:${k1b}|ignored-tail`,
    );
    assert.equal(d.ok, true);
    if (d.ok && d.parsed.kind === "text") {
      assert.equal(d.parsed.account, "vasya.ac");
      assert.equal(d.parsed.ownerKey, k1);
    }
  });

  it("parses WAX .al and XPR plain names", () => {
    const wax = parseFactoryMemo("wax", `vasya.al:${k1}:${k1b}`);
    assert.equal(wax.ok, true);
    const xpr = parseFactoryMemo("xpr", `vasya:${k1}:${k1b}`);
    assert.equal(xpr.ok, true);
  });

  it("accepts topup and 108-digit numeric memos", () => {
    assert.equal(parseFactoryMemo("telos", "topup").ok, true);
    const digits = "1".repeat(108);
    const n = parseFactoryMemo("wax", digits);
    assert.equal(n.ok, true);
    if (n.ok) assert.equal(n.parsed.kind, "numeric");
  });

  it("refuses bad nick, suffix, legacy EOS key, short numeric", () => {
    assert.equal(
      parseFactoryMemo("telos", `vasya:${k1}:${k1b}`).ok,
      false,
    );
    assert.equal(
      parseFactoryMemo("telos", `a.b.ac:${k1}:${k1b}`).ok,
      false,
    );
    assert.equal(
      parseFactoryMemo("telos", `vasya.ac:EOS6MRy…:${k1b}`).ok,
      false,
    );
    assert.equal(parseFactoryMemo("telos", "12345").ok, false);
    assert.equal(parseFactoryMemo("telos", "").ok, false);
  });

  it("exposes factory contracts from FACTORY_BY_CHAIN", () => {
    assert.equal(FACTORY_BY_CHAIN.telos.contract, "ac");
    assert.equal(FACTORY_BY_CHAIN.wax.contract, "al");
    assert.equal(FACTORY_BY_CHAIN.xpr.contract, "ac.alcor");
  });
});

describe("depositCoversFactoryFee", () => {
  it("requires quantity >= fee (teaching amounts)", () => {
    // Sample docs figures — not live table values.
    assert.equal(depositCoversFactoryFee(3_00000000n, 2_00000000n), true);
    assert.equal(depositCoversFactoryFee(1_99999999n, 2_00000000n), false);
    assert.equal(depositCoversFactoryFee(2_00000000n, 2_00000000n), true);
  });
});
