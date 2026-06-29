import type { BatchMigrateTenantAccountsInput } from "@/api/account";

export type BatchMoveMode = "existing" | "new";

export interface BatchMoveForm {
  mode: BatchMoveMode;
  groupId: "" | number;
  newGroupName: string;
  remark: string;
}

export type BatchMoveBuildResult =
  | { ok: true; payload: BatchMigrateTenantAccountsInput }
  | { ok: false; message: string };

export function buildBatchMoveInput(
  ids: number[],
  form: BatchMoveForm
): BatchMoveBuildResult {
  if (ids.length === 0) {
    return { ok: false, message: "请先选择账号" };
  }

  if (form.mode === "existing") {
    if (!form.groupId) {
      return { ok: false, message: "请选择目标分组" };
    }
    return {
      ok: true,
      payload: {
        ids,
        accountGroupId: Number(form.groupId)
      }
    };
  }

  const newGroupName = form.newGroupName.trim();
  if (!newGroupName) {
    return { ok: false, message: "请输入新分组名称" };
  }

  const newGroupRemark = form.remark.trim();
  const payload: BatchMigrateTenantAccountsInput = {
    ids,
    accountGroupId: null,
    newGroupName
  };
  if (newGroupRemark) payload.newGroupRemark = newGroupRemark;
  return { ok: true, payload };
}
