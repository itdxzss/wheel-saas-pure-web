import type {
  TenantAccountBatchCommandResult,
  TenantAccountBatchOperation,
  TenantAccountBatchPreview,
  TenantAccountBatchPreviewRequest,
  TenantAccountBatchQuery
} from "../../../api/account";

/**
 * 构造批量预估范围。有勾选 ID 时不叠加筛选条件；无勾选时只提交已生效条件。
 */
export function buildBatchPreviewRequest(
  operation: TenantAccountBatchOperation,
  ids: number[],
  appliedFilters: TenantAccountBatchQuery
): TenantAccountBatchPreviewRequest {
  return ids.length > 0
    ? { operation, scope: "IDS", ids: [...ids] }
    : { operation, scope: "QUERY", query: { ...appliedFilters } };
}

/**
 * 生成包含后端预计数量和明确操作范围的二次确认文案。
 */
export function batchConfirmMessage(
  operation: TenantAccountBatchOperation,
  selectedCount: number,
  hasAppliedFilters: boolean,
  preview: TenantAccountBatchPreview
): string {
  const matched = formatCount(preview.matched);
  const executable = formatCount(preview.executable);
  const skipped = formatCount(preview.skipped);
  const action = operation === "ONLINE" ? "批量登录" : "批量离线";
  const deregistered = preview.skipReasons.DEREGISTERED ?? 0;
  const deregisteredText =
    deregistered > 0 ? `（已注销 ${formatCount(deregistered)}）` : "";
  if (selectedCount > 0) {
    if (preview.skipped > 0) {
      return `当前已勾选 ${matched} 个账号，预计执行${action} ${executable} 个，跳过 ${skipped} 个不可登录账号${deregisteredText}，是否继续？`;
    }
    return `当前已勾选 ${matched} 个账号，将执行${action}，是否继续？`;
  }
  if (!hasAppliedFilters) {
    if (deregistered > 0) {
      return `当前未勾选账号，全部账号共 ${matched} 个；预计执行${action} ${executable} 个，跳过 ${skipped} 个不可执行账号${deregisteredText}，是否继续？`;
    }
    return `当前未勾选账号，将对全部 ${matched} 个账号执行${action}，是否继续？`;
  }
  const skipText =
    preview.skipped > 0
      ? `，跳过 ${skipped} 个不可登录账号${deregisteredText}`
      : "";
  return `当前未勾选账号，符合已生效筛选条件共 ${matched} 个；预计执行${action} ${executable} 个${skipText}，是否继续？`;
}

/** 将后端最终汇总转换为用户可见结果，不把 outbox 受理误写成最终上下线成功。 */
export function batchCommandResultMessage(
  operation: TenantAccountBatchOperation | "TAKEOVER",
  result: TenantAccountBatchCommandResult,
  singleAccount = false
): string {
  const action =
    operation === "TAKEOVER"
      ? "一键抢登"
      : singleAccount
        ? operation === "ONLINE"
          ? "上线"
          : "下线"
        : operation === "ONLINE"
          ? "批量登录"
          : "批量离线";
  const status =
    batchCommandResultType(result) === "success"
      ? "已受理"
      : result.accepted > 0
        ? "部分受理"
        : "未受理";
  const reasons = [
    ...new Set(
      (result.batchErrors ?? [])
        .map(reason =>
          reason
            .replace(/\+?\d(?:[\s()-]*\d){6,}/g, "[号码已隐藏]")
            .replace(/\s+/g, " ")
            .trim()
        )
        .filter(Boolean)
    )
  ];
  const errorSummary =
    reasons.length > 0
      ? `；原因：${reasons.slice(0, 3).join("；")}${reasons.length > 3 ? `；另有 ${reasons.length - 3} 条原因` : ""}`
      : "";
  const deregistered = result.skipReasons.DEREGISTERED ?? 0;
  const deregisteredText =
    deregistered > 0 ? `（已注销 ${formatCount(deregistered)}）` : "";
  return `${action}请求${status}，已受理 ${formatCount(result.accepted)}/${formatCount(result.requested)}，跳过 ${formatCount(result.skipped)}${deregisteredText}，失败 ${formatCount(result.failed)}${errorSummary}`;
}

export function batchCommandResultFeedback(
  operation: TenantAccountBatchOperation | "TAKEOVER",
  result: TenantAccountBatchCommandResult,
  singleAccount = false
): {
  type: "success" | "warning" | "error";
  message: string;
  duration: number;
  showClose: boolean;
} {
  const type = batchCommandResultType(result);
  return {
    type,
    message: batchCommandResultMessage(operation, result, singleAccount),
    duration: type === "success" ? 3000 : 8000,
    showClose: true
  };
}

function batchCommandResultType(
  result: TenantAccountBatchCommandResult
): "success" | "warning" | "error" {
  if (result.accepted === 0 && result.failed > 0) return "error";
  if (
    result.requested > 0 &&
    result.accepted === result.requested &&
    result.failed === 0 &&
    result.skipped === 0
  ) {
    return "success";
  }
  return "warning";
}

function formatCount(value: number): string {
  return value.toLocaleString("zh-CN");
}
