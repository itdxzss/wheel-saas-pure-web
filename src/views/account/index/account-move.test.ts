import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildBatchMoveInput } from "./account-move";

describe("account batch move payload", () => {
  it("builds payloads for moving to an existing group", () => {
    assert.deepEqual(
      buildBatchMoveInput([100, 101], {
        mode: "existing",
        groupId: 8,
        newGroupName: "",
        remark: "ignored for existing"
      }),
      {
        ok: true,
        payload: {
          ids: [100, 101],
          accountGroupId: 8
        }
      }
    );
  });

  it("builds payloads for creating a new group before moving", () => {
    assert.deepEqual(
      buildBatchMoveInput([100, 101], {
        mode: "new",
        groupId: "",
        newGroupName: "  新分组 A  ",
        remark: "  新分组备注  "
      }),
      {
        ok: true,
        payload: {
          ids: [100, 101],
          accountGroupId: null,
          newGroupName: "新分组 A",
          newGroupRemark: "新分组备注"
        }
      }
    );
  });

  it("returns validation errors for incomplete move forms", () => {
    assert.deepEqual(
      buildBatchMoveInput([], {
        mode: "existing",
        groupId: 8,
        newGroupName: "",
        remark: ""
      }),
      { ok: false, message: "请先选择账号" }
    );
    assert.deepEqual(
      buildBatchMoveInput([100], {
        mode: "existing",
        groupId: "",
        newGroupName: "",
        remark: ""
      }),
      { ok: false, message: "请选择目标分组" }
    );
    assert.deepEqual(
      buildBatchMoveInput([100], {
        mode: "new",
        groupId: "",
        newGroupName: " ",
        remark: ""
      }),
      { ok: false, message: "请输入新分组名称" }
    );
  });
});
