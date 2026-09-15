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
  CANCELLING: "等待取消订单",
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
  if (["UNKNOWN", "REVIEW_REQUIRED", "CANCELLING"].includes(state))
    return "warning";
  return "info";
}

const FAILURE_LABELS: Record<string, string> = {
  PURCHASE_TIER_UNAVAILABLE: "当前档位无法锁定供应商，请刷新价格或选择其他档位",
  PURCHASE_PRICE_MISMATCH: "成交价与所选档位不符，等待取消订单",
  PURCHASE_PRICE_MISMATCH_CANCELLED: "成交价不符，购号订单已取消",
  PURCHASE_CANCELLATION_TIMEOUT: "订单取消超时，请核对供应商订单",
  PURCHASE_CANCELLATION_CODE_RECEIVED: "异常价格订单已收到短信，需要人工核对",
  PURCHASE_CANCELLATION_UNCONFIRMED: "订单取消结果待核对",
  SMS_NO_NUMBERS: "供应商未分配到号码"
};

/** 保留未知原因码，避免把未支持的错误误报为已处理。 */
export function registrationFailureLabel(code?: string | null): string {
  return code ? (FAILURE_LABELS[code] ?? code) : "—";
}

/** Grizzly 现行价格、余额和成交金额按 USD 计价；不依据旧币种标记换算金额。 */
export function registrationActualCost(cost?: string | number | null): string {
  return cost == null ? "未返回" : `${cost} 美元（USD）`;
}

/** 仅有尚未采购项的任务可申请停止；已采购项仍继续收尾。 */
export function canCancelRegistration(task: AccountRegistrationTask): boolean {
  return (
    !task.cancelRequested &&
    task.counts.pending > 0 &&
    (task.status === "PENDING" || task.status === "RUNNING")
  );
}
