import type { SmsActivationState } from "@/api/sms-activation";

const STATE_LABELS: Record<SmsActivationState, string> = {
  WAITING_CODE: "等码中",
  RECEIVED: "已收码",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
  EXPIRED: "已过期"
};

const STATE_TAGS: Record<
  SmsActivationState,
  "primary" | "success" | "info" | "warning"
> = {
  WAITING_CODE: "primary",
  RECEIVED: "success",
  COMPLETED: "info",
  CANCELLED: "warning",
  EXPIRED: "info"
};

/** 接码状态中文名。 */
export function smsStateLabel(state: SmsActivationState): string {
  return STATE_LABELS[state] ?? state;
}

/** 接码状态标签颜色。 */
export function smsStateTag(
  state: SmsActivationState
): "primary" | "success" | "info" | "warning" {
  return STATE_TAGS[state] ?? "info";
}

/** 剩余秒数格式化为 mm:ss；已过点返回空串。 */
export function countdown(target: number, now: number): string {
  const seconds = Math.ceil((target - now) / 1000);
  if (seconds <= 0) return "";
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
