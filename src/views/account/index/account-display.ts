import type { TenantAccount, TenantAccountSummary } from "../../../api/account";

export type AccountTagType = "success" | "danger" | "info";

export interface AccountStatCard {
  key: string;
  label: string;
  value: number;
}

function compactLabels(values: Array<string | null | undefined>): string {
  const labels = values.map(value => value?.trim()).filter(Boolean);
  return labels.length > 0 ? labels.join(" / ") : "-";
}

export function accountStatusLabel(
  row: Pick<TenantAccount, "account_state" | "mute_status">
): string {
  if (row.mute_status === "6h") return "禁言6小时";
  if (row.mute_status === "24h") return "禁言24小时";
  const map: Record<number, string> = {
    1: "新增",
    2: "正常",
    3: "封禁",
    4: "导出",
    5: "解绑"
  };
  return row.account_state ? (map[row.account_state] ?? "-") : "待上线";
}

export function accountStatusTagType(
  row: Pick<TenantAccount, "account_state" | "mute_status">
): AccountTagType {
  if (row.mute_status === "6h" || row.mute_status === "24h") {
    return "danger";
  }
  if (row.account_state === 2 || row.account_state === 4) return "success";
  if (row.account_state === 3 || row.account_state === 5) return "danger";
  return "info";
}

export function loginStateLabel(value?: number | null): string {
  return value === 1 ? "在线" : value === 2 ? "离线" : "—";
}

export function loginStateTagType(value?: number | null): AccountTagType {
  if (value === 1) return "success";
  if (value === 2) return "danger";
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
  row: Pick<TenantAccount, "account_type" | "device_os">
): string {
  return compactLabels([row.account_type, row.device_os]);
}

export function sourceLabel(
  row: Pick<TenantAccount, "channel_name" | "number_source">
): string {
  return compactLabels([row.channel_name, row.number_source]);
}

export function buildAccountStatCards(
  summary: TenantAccountSummary
): AccountStatCard[] {
  const pendingOnline = Math.max(
    summary.total - summary.online - summary.offline,
    0
  );
  return [
    { key: "total", label: "总账号数", value: summary.total },
    { key: "banned", label: "封禁账号", value: summary.banned },
    { key: "online", label: "在线账号", value: summary.online },
    { key: "offline", label: "离线账号", value: summary.offline },
    { key: "pendingOnline", label: "待上线账号", value: pendingOnline },
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
      row.account_state === 5) &&
    !row.dispatched_at
  );
}
