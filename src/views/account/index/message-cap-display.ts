import type {
  MessageCap,
  MessageCapItem,
  MessageCapQueryStatus
} from "@/api/account-message-cap";

type TagType = "success" | "warning" | "danger" | "info";

/** 单账号处理结果的展示：谁没查到、为什么没查到要一眼可辨。 */
export const QUERY_STATUS_META: Record<
  MessageCapQueryStatus,
  { label: string; type: TagType }
> = {
  SUCCESS: { label: "查询成功", type: "success" },
  REJECTED: { label: "平台拒绝", type: "danger" },
  OFFLINE: { label: "账号不在线", type: "warning" },
  UNSUPPORTED_BACKEND: { label: "暂不支持该协议", type: "info" },
  ACCOUNT_UNAVAILABLE: { label: "账号不可用", type: "info" },
  FAILED: { label: "查询失败", type: "danger" }
};

/** 协议层对响应完整度的判定。 */
const RESULT_STATUS_LABEL: Record<string, string> = {
  OK: "数据完整",
  PARTIAL: "部分数据",
  NO_DATA: "平台无数据",
  UNSUPPORTED_FORMAT: "响应格式暂不支持",
  NON_NUMERIC_QUOTA: "平台未下发有效额度",
  REJECTED: "平台拒绝"
};

/** 枚举含义取自 Android 2.26.36.73 客户端枚举；未知取值走 enumLabel 原样展示。 */
const ENUM_LABELS: Record<string, Record<string, string>> = {
  cappingStatus: {
    NONE: "未触发限制",
    FIRST_WARNING: "第一次预警",
    SECOND_WARNING: "第二次预警",
    CAPPED: "已达上限"
  },
  oteStatus: {
    NOT_ELIGIBLE: "不可申请",
    ELIGIBLE: "可申请",
    ACTIVE_IN_CURRENT_CYCLE: "本周期已启用",
    EXHAUSTED: "已用完"
  },
  mvStatus: {
    NOT_ELIGIBLE: "不符合资格",
    NOT_ACTIVE: "未开通",
    ACTIVE: "已开通",
    ACTIVE_UPGRADE_AVAILABLE: "已开通·可升级"
  },
  subscriptionStatus: {
    NOT_ELIGIBLE: "不符合资格",
    NOT_ACTIVE: "未开通",
    ACTIVE: "已开通",
    ACTIVE_UPGRADE_AVAILABLE: "已开通·可升级"
  }
};

export type EnumField = keyof typeof ENUM_LABELS;

const EMPTY = "—";

export function resultStatusLabel(status: string | null | undefined): string {
  if (!status) return EMPTY;
  return RESULT_STATUS_LABEL[status] ?? status;
}

/** 枚举值展示为“中文（原值）”；未识别的值只显示原值，不臆造含义。 */
export function enumLabel(
  field: EnumField,
  value: string | null | undefined
): string {
  if (!value) return EMPTY;
  const label = ENUM_LABELS[field]?.[value];
  return label ? `${label}（${value}）` : value;
}

/** 额度原值展示；-1 是平台特殊值，明确标注而不是当作无限或 0。 */
export function formatQuota(value: string | null | undefined): string {
  if (value === null || value === undefined || value === "") return EMPTY;
  return value === "-1" ? "-1（平台特殊值）" : value;
}

/** 剩余额度只展示后端算出的值；算不出来就是“未知”。 */
export function formatRemaining(cap: MessageCap | null): string {
  if (!cap) return EMPTY;
  return cap.remaining ?? "未知";
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** 秒级时间戳转本地时间；非法值原样返回以便排查。 */
export function formatEpochSeconds(value: string | null | undefined): string {
  if (!value) return EMPTY;
  if (!/^\d{1,12}$/.test(value)) return value;
  const date = new Date(Number(value) * 1000);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function formatCycle(cap: MessageCap | null): string {
  if (!cap || (!cap.cycleStart && !cap.cycleEnd)) return EMPTY;
  return `${formatEpochSeconds(cap.cycleStart)} ~ ${formatEpochSeconds(cap.cycleEnd)}`;
}

/** 订阅展示：状态与名称同时给出；平台没返回订阅对象时为空。 */
export function formatSubscription(cap: MessageCap | null): string {
  if (!cap || (!cap.subscriptionStatus && !cap.subscriptionName)) return EMPTY;
  const status = enumLabel("subscriptionStatus", cap.subscriptionStatus);
  return cap.subscriptionName ? `${status} · ${cap.subscriptionName}` : status;
}

/** 展开行里展示的完整原始数据；包含 debug 的原始十六进制，便于做实验核对。 */
export function rawJsonText(item: MessageCapItem): string {
  return JSON.stringify(item, null, 2);
}

/** 未拿到额度时的补充说明（失败码等），展示在状态标签旁。 */
export function queryStatusNote(item: MessageCapItem): string {
  if (item.queryStatus === "FAILED" && item.errorCode) return item.errorCode;
  return "";
}
