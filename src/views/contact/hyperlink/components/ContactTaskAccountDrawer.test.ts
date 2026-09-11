import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
const read = (name: string) =>
  readFileSync(new URL(name, import.meta.url), "utf8");
const source = read("./ContactTaskAccountDrawer.vue");
const accounts = read("./ContactTaskAccountTable.vue");
describe("contact task result drawer", () => {
  it("unifies overview, accounts and recipient drilldowns", () => {
    for (const component of [
      "ContactTaskOverview",
      "ContactTaskAccountTable",
      "ContactTaskRecipientTable"
    ])
      assert.ok(source.includes(`<${component}`));
    assert.match(source, /selectedAccount.value = account.taskAccountId/);
    assert.match(source, /selectedErrorCode.value = errorCode/);
    assert.match(source, /:key="selectionVersion"/);
  });
  it("unmounts hidden data tabs and limits refresh to visible results", () => {
    assert.match(source, /destroy-on-close/);
    assert.match(source, /visible && taskId != null && tab === 'accounts'/);
    assert.match(source, /visible && taskId != null && tab === 'recipients'/);
    assert.match(source, /needsReceiptRefresh\(stats.value\)/);
  });
  it("uses server sorting and snapshot state instead of account validity", () => {
    assert.match(accounts, /sortable="custom"/);
    assert.match(accounts, /listContactTaskAccountData/);
    assert.match(accounts, /sortBy: sortBy.value/);
    assert.match(accounts, /accountStateLabels\[row.state\]/);
    assert.doesNotMatch(accounts, /封号|无效/);
  });
});
