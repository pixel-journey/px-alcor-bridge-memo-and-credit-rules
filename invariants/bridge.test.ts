import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertDepositMemo,
  decideBridgeCredit,
  feeWithinCap,
  isUnsupportedDepositNetwork,
  routeHops,
  userMemoFromTelosPayout,
  WRAP_CONTRACT,
  BRIDGE_ACCOUNT,
  LEGACY_USDT_CONTRACT,
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
