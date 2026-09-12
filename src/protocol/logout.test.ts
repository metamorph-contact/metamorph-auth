import { describe, expect, it } from "vitest";

import type { BrowserLogoutResultV1 } from "../contracts/generated/csi10/BrowserLogoutResultV1";
import { __test } from "./logout";

const operationId = "018f3d2a-71c0-7a62-8f4a-111111111111";
const accountA = "018f3d2a-71c0-7a62-8f4a-222222222222";
const accountB = "018f3d2a-71c0-7a62-8f4a-333333333333";

function notCommittedAccount(browserAccountId: string): BrowserLogoutResultV1 {
  return {
    state: "notCommittedAccount",
    schemaVersion: 1,
    operationId,
    scope: "identityAccount",
    browserAccountId,
    recoveryAction: "none",
  };
}

describe("logout result target binding", () => {
  it("accepts the account selected by the pending operation", () => {
    expect(() =>
      __test.assertLogoutResult(
        notCommittedAccount(accountA),
        "identityAccount",
        operationId,
        accountA,
      ),
    ).not.toThrow();
  });

  it("rejects an account-scoped result for another account", () => {
    expect(() =>
      __test.assertLogoutResult(
        notCommittedAccount(accountA),
        "identityAccount",
        operationId,
        accountB,
      ),
    ).toThrow("selected another account");
  });
});
