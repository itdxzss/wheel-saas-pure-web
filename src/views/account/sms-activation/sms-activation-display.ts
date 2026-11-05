import type {
  SmsActivation,
  SmsActivationState,
  SmsRegistrationState
} from "@/api/sms-activation";

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

const REGISTRATION_LABELS: Record<SmsRegistrationState, string> = {
  REQUESTING: "申请验证码中",
  WAITING_CODE: "等待验证码",
  VERIFYING: "验证中",
  REGISTERED: "已注册",
  ACTION_REQUIRED: "需处理"
};

const REGISTRATION_TAGS: Record<
  SmsRegistrationState,
  "primary" | "success" | "info" | "warning" | "danger"
> = {
  REQUESTING: "primary",
  WAITING_CODE: "primary",
  VERIFYING: "primary",
  REGISTERED: "success",
  ACTION_REQUIRED: "danger"
};

/** 需处理原因码对应的运营可读说明；未识别的码原样显示，便于排查。 */
const FAILURE_LABELS: Record<string, string> = {
  ORDER_NOT_WAITING: "订单已不是等码状态",
  ORDER_EXPIRED: "订单已过期",
  SMS_CANCELLED: "号商订单已取消",
  GO_REJECTED: "注册服务拒绝了请求",
  GO_CONFLICT: "注册服务报告冲突（该号码可能已有注册事务）",
  GO_UNAVAILABLE: "注册服务暂不可用",
  GO_OUTCOME_UNKNOWN: "注册结果不明，已停止以免重复发码",
  GO_ACTION_REQUIRED: "需要人工处理（二步验证或图形挑战）",
  NO_RESULT_BEFORE_EXPIRY: "订单到期时仍没有明确结果",
  PROXY_UNAVAILABLE: "占用的代理不可用"
};

/** 注册办理状态中文名。 */
export function registrationLabel(state: SmsRegistrationState): string {
  return REGISTRATION_LABELS[state] ?? state;
}

/** 注册办理状态标签颜色。 */
export function registrationTag(
  state: SmsRegistrationState
): "primary" | "success" | "info" | "warning" | "danger" {
  return REGISTRATION_TAGS[state] ?? "info";
}

/** 需处理原因的可读说明。 */
export function registrationFailureLabel(code: string): string {
  return FAILURE_LABELS[code] ?? code;
}

/** 后台仍在推进注册：此时订单被占用，完成/取消按钮必须隐藏，页面也要继续刷新进度。 */
export function registrationRunning(row: SmsActivation): boolean {
  return (
    row.registrationState === "REQUESTING" ||
    row.registrationState === "WAITING_CODE" ||
    row.registrationState === "VERIFYING"
  );
}

/** 只有等码中、尚未收到验证码、也没点过开始注册的订单才能开始注册。 */
export function canStartRegistration(row: SmsActivation): boolean {
  return row.state === "WAITING_CODE" && !row.smsCode && !row.registrationState;
}

/** 剩余秒数格式化为 mm:ss；已过点返回空串。 */
export function countdown(target: number, now: number): string {
  const seconds = Math.ceil((target - now) / 1000);
  if (seconds <= 0) return "";
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
