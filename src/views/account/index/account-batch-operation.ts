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
  if (selectedCount > 0) {
    if (preview.skipped > 0) {
      return `当前已勾选 ${matched} 个账号，预计执行${action} ${executable} 个，跳过 ${skipped} 个不可登录账号，是否继续？`;
    }
    return `当前已勾选 ${matched} 个账号，将执行${action}，是否继续？`;
  }
  if (!hasAppliedFilters) {
    return `当前未勾选账号，将对全部 ${matched} 个账号执行${action}，是否继续？`;
  }
  const skipText =
    preview.skipped > 0 ? `，跳过 ${skipped} 个不可登录账号` : "";
  return `当前未勾选账号，符合已生效筛选条件共 ${matched} 个；预计执行${action} ${executable} 个${skipText}，是否继续？`;
}

/** 将后端最终汇总转换为用户可见结果，不把 outbox 受理误写成最终上下线成功。 */
export function batchCommandResultMessage(
  operation: TenantAccountBatchOperation,
  result: TenantAccountBatchCommandResult
): string {
  const action = operation === "ONLINE" ? "批量登录" : "批量离线";
  return `${action}请求已提交，已受理 ${formatCount(result.accepted)}/${formatCount(result.requested)}，跳过 ${formatCount(result.skipped)}，失败 ${formatCount(result.failed)}`;
}

function formatCount(value: number): string {
  return value.toLocaleString("zh-CN");
}
