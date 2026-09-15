import type { AccountRegistrationTask } from "@/api/account-registration";

const STATE_LABELS: Record<string, string> = {
  PENDING: "待采购",
  RUNNING: "执行中",
  PURCHASING: "采购中",
  WAITING_CODE: "等待短信",
  REGISTERING: "注册中",
  IMPORTING: "导入中",
  WAITING_ONLINE: "等待上线",
  SUCCEEDED: "成功",
  FAILED: "失败",
  UNKNOWN: "待核对",
  REVIEW_REQUIRED: "待核对",
  CANCELLED: "已取消",
  COMPLETED: "已结束"
};

/** 未识别状态保留服务端原值，不能误判为成功。 */
export function registrationStateLabel(state: string): string {
  return STATE_LABELS[state] ?? state;
}

/** 结束任务仍须查看成功、失败和待核对数量。 */
export function registrationTagType(
  state: string
): "info" | "success" | "warning" | "danger" {
  if (state === "SUCCEEDED") return "success";
  if (state === "FAILED") return "danger";
  if (state === "UNKNOWN" || state === "REVIEW_REQUIRED") return "warning";
  return "info";
}

/** 仅有尚未采购项的任务可申请停止；已采购项仍继续收尾。 */
export function canCancelRegistration(task: AccountRegistrationTask): boolean {
  return (
    !task.cancelRequested &&
    task.counts.pending > 0 &&
    (task.status === "PENDING" || task.status === "RUNNING")
  );
}
