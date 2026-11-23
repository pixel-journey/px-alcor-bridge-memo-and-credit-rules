import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertDepositMemo,
  decideBridgeCredit,
  depositCoversFactoryFee,
  factoryRemainderAfterFee,
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
  const r1 = "PUB_R1_exampleTeachingKeyNotChecksumVerifiedxx";
  const wa = "PUB_WA_exampleTeachingKeyNotChecksumVerifiedxx";

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
    assert.equal(parseFactoryMemo("wax", `vasya.al:${k1}:${k1b}`).ok, true);
    assert.equal(parseFactoryMemo("xpr", `vasya:${k1}:${k1b}`).ok, true);
  });

  it("accepts PUB_R1_ and PUB_WA_ prefixes", () => {
    assert.equal(parseFactoryMemo("telos", `vasya.ac:${r1}:${wa}`).ok, true);
  });

  it("accepts topup and 108-digit numeric memos", () => {
    assert.equal(parseFactoryMemo("telos", "topup").ok, true);
    const digits = "1".repeat(108);
    const n = parseFactoryMemo("wax", digits);
    assert.equal(n.ok, true);
    if (n.ok) assert.equal(n.parsed.kind, "numeric");
  });

  it("refuses official shape errors from the docs", () => {
    // missing suffix
    assert.equal(parseFactoryMemo("telos", `vasya:${k1}:${k1b}`).ok, false);
    // nick contains a dot
    assert.equal(parseFactoryMemo("telos", `a.b.ac:${k1}:${k1b}`).ok, false);
    // legacy EOS key
    assert.equal(
      parseFactoryMemo("telos", `vasya.ac:EOS6MRy…:${k1b}`).ok,
      false,
    );
    // short / empty / non-108 numeric
    assert.equal(parseFactoryMemo("telos", "12345").ok, false);
    assert.equal(parseFactoryMemo("telos", "").ok, false);
    // uppercase / 0 / 6-9 not in nick charset
    assert.equal(parseFactoryMemo("telos", `Vasya.ac:${k1}:${k1b}`).ok, false);
    assert.equal(parseFactoryMemo("telos", `v0sya.ac:${k1}:${k1b}`).ok, false);
    assert.equal(parseFactoryMemo("telos", `v6sya.ac:${k1}:${k1b}`).ok, false);
    // longer than 12 characters
    assert.equal(
      parseFactoryMemo("telos", `abcdefghij.ac:${k1}:${k1b}`).ok,
      false,
    );
    // XPR too short (<4) and dotted plain name
    assert.equal(parseFactoryMemo("xpr", `abc:${k1}:${k1b}`).ok, false);
    assert.equal(parseFactoryMemo("xpr", `ab.cd:${k1}:${k1b}`).ok, false);
  });

  it("exposes factory contracts from FACTORY_BY_CHAIN", () => {
    assert.equal(FACTORY_BY_CHAIN.telos.contract, "ac");
    assert.equal(FACTORY_BY_CHAIN.wax.contract, "al");
    assert.equal(FACTORY_BY_CHAIN.xpr.contract, "ac.alcor");
  });
});

describe("depositCoversFactoryFee and remainder", () => {
  it("requires quantity >= fee (teaching amounts)", () => {
    assert.equal(depositCoversFactoryFee(3_00000000n, 2_00000000n), true);
    assert.equal(depositCoversFactoryFee(1_99999999n, 2_00000000n), false);
    assert.equal(depositCoversFactoryFee(2_00000000n, 2_00000000n), true);
  });

  it("remainder is quantity - fee or null when under-fee", () => {
    assert.equal(factoryRemainderAfterFee(3_00000000n, 2_00000000n), 1_00000000n);
    assert.equal(factoryRemainderAfterFee(2_00000000n, 2_00000000n), 0n);
    assert.equal(factoryRemainderAfterFee(1_99999999n, 2_00000000n), null);
  });
});
