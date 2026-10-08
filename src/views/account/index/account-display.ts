import type { TenantAccount, TenantAccountSummary } from "../../../api/account";
import { accountStatusLabel, loginStateLabel } from "@/utils/account-state";

export { accountStatusLabel, loginStateLabel };

export type AccountTagType = "success" | "danger" | "info" | "warning";

export interface AccountStatCard {
  key: string;
  label: string;
  value: number;
  subItems?: Array<{ label: string; value: number }>;
}

export interface BusinessRestrictionLine {
  key: "message" | "pulling";
  label: string;
  until?: string | null;
  source: "平台下发" | "系统推断";
}

function compactLabels(values: Array<string | null | undefined>): string {
  const labels = values.map(value => value?.trim()).filter(Boolean);
  return labels.length > 0 ? labels.join(" / ") : "-";
}

export function accountStatusTagType(
  row: Pick<TenantAccount, "account_state" | "mute_status">
): AccountTagType {
  if (row.account_state === 2 || row.account_state === 4) return "success";
  if (row.account_state === 3 || row.account_state === 5) return "danger";
  if (
    row.account_state === 6 ||
    row.account_state === 7 ||
    row.account_state === 8
  )
    return "warning";
  return "info";
}

/** 列表 API 的无时区时间统一为北京时间，与浏览器所在时区无关。 */
function restrictionEpochMillis(value?: string | null): number | null {
  if (!value) return null;
  const iso = value.trim().replace(" ", "T");
  const zoned = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(iso) ? iso : `${iso}+08:00`;
  const timestamp = Date.parse(zoned);
  return Number.isFinite(timestamp) ? timestamp : null;
}

/** 把两类业务风控按各自截止时间及来源展开，不与账号生命周期混用。 */
export function businessRestrictionLines(
  row: Pick<
    TenantAccount,
    | "mute_status"
    | "message_restriction_until"
    | "pulling_restriction_until"
    | "platform_message_restriction_until"
    | "fallback_message_restriction_until"
  >
): BusinessRestrictionLine[] {
  const lines: BusinessRestrictionLine[] = [];
  const platformUntil = restrictionEpochMillis(
    row.platform_message_restriction_until
  );
  const fallbackUntil = restrictionEpochMillis(
    row.fallback_message_restriction_until
  );
  if (row.mute_status === 1 || row.mute_status === 3) {
    lines.push({
      key: "message",
      label: "消息发送",
      until: row.message_restriction_until,
      source:
        platformUntil !== null &&
        (fallbackUntil === null || platformUntil >= fallbackUntil)
          ? "平台下发"
          : "系统推断"
    });
  }
  if (row.mute_status === 2 || row.mute_status === 3) {
    lines.push({
      key: "pulling",
      label: "进群拉人",
      until: row.pulling_restriction_until,
      source:
        platformUntil !== null &&
        platformUntil === restrictionEpochMillis(row.pulling_restriction_until)
          ? "平台下发"
          : "系统推断"
    });
  }
  return lines;
}

/** 只统计尚未到期的平台限制；人工解除不会解除 WhatsApp 平台风控。 */
export function clearOperationRestrictionsConfirmMessage(
  selectedRows: Pick<TenantAccount, "platform_message_restriction_until">[],
  now: number
): string {
  const activeUntil = selectedRows
    .map(row => restrictionEpochMillis(row.platform_message_restriction_until))
    .filter((until): until is number => until !== null && until > now);
  const base =
    `确认手动移除选中的 ${selectedRows.length} 个账号的风控时间限制？` +
    "将同时移除消息发送和进群拉人的本地风控时间；" +
    "后续新的风控结果仍会重新限制账号。";
  if (activeUntil.length === 0) return base;
  const latestUntil = Math.max(...activeUntil);
  // 和列表日期口径相同，明确展示北京时间以免跨时区误解恢复时间。
  const latestLabel = new Date(latestUntil + 8 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
  return (
    base +
    `其中 ${activeUntil.length} 个账号的 WhatsApp 平台触达限制尚未到期（最晚 ${latestLabel} 北京时间），` +
    "解除只清本地状态，平台仍会拒绝进群、拉人和新会话。"
  );
}

/** 将协议原因码转换为业务可读文案；未知原因仍保留原码，便于排查。 */
export function accountRestrictionReasonLabel(value?: string | null): string {
  if (!value) return "—";
  const labels: Record<string, string> = {
    RATE_LIMITED: "频率受限",
    ACCOUNT_REACHOUT_RESTRICTED: "账号触达受限",
    CHAT_SUSPENDED: "会话发送受限",
    MESSAGE_SENDING_RESTRICTED: "消息发送受限",
    PULLING_RESTRICTED: "进群拉人受限",
    PULLER_HISTORY_RESTRICTION: "历史拉人限制"
  };
  return labels[value] ?? value;
}

export function loginStateTagType(value?: number | null): AccountTagType {
  if (value === 1) return "success";
  if (value === 2) return "danger";
  if (value === 3) return "warning";
  return "info";
}

export function riskStatusLabel(value?: number | null): string {
  const map: Record<number, string> = {
    1: "未风控",
    2: "风控中",
    3: "待解除"
  };
  return value ? (map[value] ?? "-") : "—";
}

export function accountTypeDeviceLabel(
  row: Pick<
    TenantAccount,
    | "account_type"
    | "declared_account_type"
    | "account_type_verify_status"
    | "business_verification_level"
    | "device_os"
  >
): string {
  let accountType = row.account_type?.trim() ?? "";
  switch (row.account_type_verify_status) {
    case 0:
      accountType += "（校验中）";
      break;
    case 1:
      accountType += "（已确认）";
      break;
    case 2:
      accountType += row.declared_account_type
        ? `（已纠正，导入${row.declared_account_type}）`
        : "（已纠正）";
      break;
    case 3:
      accountType += "（未确认）";
      break;
    case 4:
      accountType += "（未校验）";
      break;
  }
  const verificationBadge =
    row.business_verification_level === 1 ? "蓝标" : null;
  return compactLabels([accountType, row.device_os, verificationBadge]);
}

export function sourceLabel(
  row: Pick<TenantAccount, "channel_name" | "number_source">
): string {
  return compactLabels([row.channel_name, row.number_source]);
}

export function buildAccountStatCards(
  summary: TenantAccountSummary
): AccountStatCard[] {
  return [
    { key: "total", label: "总账号数", value: summary.total },
    {
      key: "restricted",
      label: "异常账号",
      value: summary.restrictedTotal,
      subItems: [
        { label: "封禁", value: summary.banned },
        { label: "解绑", value: summary.unbound },
        { label: "操作受限", value: summary.muted },
        { label: "导出", value: summary.exported },
        { label: "受限", value: summary.restricted }
      ]
    },
    { key: "online", label: "在线账号", value: summary.online },
    { key: "offline", label: "离线账号", value: summary.offline },
    { key: "pendingOnline", label: "待上线账号", value: summary.pendingOnline },
    { key: "risk", label: "风控账号", value: summary.risk },
    { key: "assigned", label: "已分配账号", value: summary.assigned },
    { key: "unassigned", label: "未分配账号", value: summary.unassigned }
  ];
}

export function canDeleteAccount(
  row: Pick<TenantAccount, "account_state" | "dispatched_at">
): boolean {
  return (
    (row.account_state === 3 ||
      row.account_state === 4 ||
      row.account_state === 5 ||
      row.account_state === 6 ||
      row.account_state === 9) &&
    !row.dispatched_at
  );
}
