import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { accountImportAbnormalLabel } from "./account-import-display";

describe("account import display helpers", () => {
  it("shows aggregated login abnormal count when backend only returns total abnormal", () => {
    assert.equal(
      accountImportAbnormalLabel({
        abnormal: 5,
        abnormal_key: 0,
        abnormal_ban: 0
      }),
      "5"
    );
  });
});
