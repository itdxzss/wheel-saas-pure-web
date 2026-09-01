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

/** 把两类业务风控按各自截止时间展开，不与账号生命周期混用。 */
export function businessRestrictionLines(
  row: Pick<
    TenantAccount,
    "mute_status" | "message_restriction_until" | "pulling_restriction_until"
  >
): BusinessRestrictionLine[] {
  const lines: BusinessRestrictionLine[] = [];
  if (row.mute_status === 1 || row.mute_status === 3) {
    lines.push({
      key: "message",
      label: "超链发送",
      until: row.message_restriction_until
    });
  }
  if (row.mute_status === 2 || row.mute_status === 3) {
    lines.push({
      key: "pulling",
      label: "拉手拉人",
      until: row.pulling_restriction_until
    });
  }
  return lines;
}

/** 将协议原因码转换为业务可读文案；未知原因仍保留原码，便于排查。 */
export function accountRestrictionReasonLabel(value?: string | null): string {
  if (!value) return "—";
  const labels: Record<string, string> = {
    RATE_LIMITED: "频率受限",
    ACCOUNT_REACHOUT_RESTRICTED: "账号触达受限",
    CHAT_SUSPENDED: "会话发送受限",
    MESSAGE_SENDING_RESTRICTED: "消息发送受限",
    PULLING_RESTRICTED: "拉人受限",
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
      row.account_state === 6) &&
    !row.dispatched_at
  );
}
