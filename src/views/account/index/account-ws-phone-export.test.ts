import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TenantAccount } from "../../../api/account";
import { analyzeWsPhoneExportSelection } from "./account-ws-phone-export";

describe("account WS phone export selection", () => {
  it("separates normal and non-normal selected accounts", () => {
    const result = analyzeWsPhoneExportSelection([
      { id: 101, account_state: 2, group_name: "客户组" },
      { id: 102, account_state: 3, group_name: "客户组" },
      { id: 103, account_state: null, group_name: "客户组" }
    ] satisfies TenantAccount[]);

    assert.equal(result.normalCount, 1);
    assert.equal(result.abnormalCount, 2);
    assert.equal(result.invalidIdCount, 0);
    assert.deepEqual(result.ids, [101, 102, 103]);
  });

  it("uses the group filename only when every selected account shares one group", () => {
    const now = new Date("2026-07-14T16:30:00.000Z");
    const singleGroup = analyzeWsPhoneExportSelection(
      [
        { id: 101, account_state: 2, group_name: "马来西亚/客户组" },
        { id: 102, account_state: 2, group_name: "马来西亚/客户组" }
      ] satisfies TenantAccount[],
      now
    );
    const mixedGroups = analyzeWsPhoneExportSelection(
      [
        { id: 101, account_state: 2, group_name: "马来西亚客户组" },
        { id: 102, account_state: 2, group_name: "新加坡客户组" }
      ] satisfies TenantAccount[],
      now
    );

    assert.equal(singleGroup.groupName, "马来西亚/客户组");
    assert.equal(singleGroup.previewFilename, "马来西亚_客户组_2026-07-15.txt");
    assert.equal(mixedGroups.groupName, undefined);
    assert.equal(mixedGroups.previewFilename, "全部WS号_2026-07-15.txt");
  });
});
