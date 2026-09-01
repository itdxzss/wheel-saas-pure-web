import type { TenantAccount } from "@/api/account";

/** 将账号生命周期状态转换为中文标签；业务风控独立展示。 */
export function accountStatusLabel(
  row: Pick<TenantAccount, "account_state" | "mute_status">
): string {
  const map: Record<number, string> = {
    1: "新增",
    2: "正常",
    3: "封禁",
    4: "导出",
    5: "解绑",
    6: "被抢登",
    7: "抢登中",
    8: "账号受限"
  };
  return row.account_state ? (map[row.account_state] ?? "-") : "—";
}

/** 将账号登录状态转换为统一中文标签。 */
export function loginStateLabel(value?: number | null): string {
  if (value === 1) return "在线";
  if (value === 2) return "离线";
  if (value === 3) return "待上线";
  return "—";
}
