import type { JoinResultRow } from "@/api/join-task";

/** 仅实际触发审核处理的待执行行显示进度，普通进群沿用原文案。 */
export function approvalProgressLabel(row: JoinResultRow): string | undefined {
  if (row.status !== "PENDING" || !row.approvalStatus) return undefined;
  const labels: Record<string, string> = {
    RESOLVE: "正在查找原管理员",
    CLOSE: "正在关闭审核",
    CHECK: "正在确认进群",
    APPROVE: "正在处理进群申请",
    REJOIN: "正在继续进群",
    VERIFY: "正在确认进群结果"
  };
  return labels[row.approvalStatus];
}

/** 入群失败时管理员阶段未执行，不能把默认 WAITING 展示成正在设置。 */
export function adminStageLabel(row: JoinResultRow, enabled: boolean): string {
  if (!enabled) return "未开启";
  if (row.status === "FAILED") return "未执行";
  if (row.status !== "SUCCESS") return "等待进群成功";
  const labels: Record<string, string> = {
    WAITING: "等待管理员",
    SUBMITTED: "设置中",
    UNKNOWN: "结果核实中",
    SUCCESS: "成功",
    FAILED: "失败"
  };
  return labels[row.adminStatus ?? ""] ?? "待确认";
}

/** 步骤结果优先使用后端两阶段结论，旧响应只在未开启功能时回退。 */
export function joinStepStatus(row: JoinResultRow, enabled: boolean): string {
  if (row.stepStatus) return row.stepStatus;
  if (row.status === "FAILED") return "FAILED";
  return enabled ? "PENDING" : row.status;
}

/** 清理失败与提权成功独立展示，进群/提权未成功时不会误报正在踢人。 */
export function cleanupStageLabel(row: JoinResultRow): string {
  if (row.status === "FAILED" || row.adminStatus === "FAILED") return "未执行";
  const labels: Record<string, string> = {
    WAITING: "等待清理",
    LISTING: "读取清理名单",
    REMOVE_READY: "等待踢出管理员",
    REMOVING: "正在踢出管理员",
    LEAVE_READY: "等待原号退群",
    LEAVING: "原号退群中",
    SUCCESS: "清理及退群成功",
    FAILED: "失败，后续已停止"
  };
  return labels[row.cleanupStatus ?? ""] ?? "等待提权成功";
}
