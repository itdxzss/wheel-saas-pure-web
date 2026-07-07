import type {
  AccountState,
  MuteStatus,
  TenantAccountListQuery
} from "../../../api/account";

export type AccountStatusFilter =
  | ""
  | "正常"
  | "账号受限"
  | "封禁"
  | "导出"
  | "禁言6小时"
  | "禁言24小时"
  | "解绑"
  | "被抢登"
  | "抢登中";

export const accountStatusOptions: Exclude<AccountStatusFilter, "">[] = [
  "正常",
  "账号受限",
  "被抢登",
  "抢登中",
  "封禁",
  "导出",
  "禁言6小时",
  "禁言24小时",
  "解绑"
];

const accountStateMap: Partial<Record<AccountStatusFilter, AccountState>> = {
  正常: 2,
  账号受限: 8,
  封禁: 3,
  导出: 4,
  解绑: 5,
  被抢登: 6,
  抢登中: 7
};

const muteStatusMap: Partial<Record<AccountStatusFilter, MuteStatus>> = {
  禁言6小时: 1,
  禁言24小时: 2
};

export function accountStatusToQuery(
  status: AccountStatusFilter
): Pick<TenantAccountListQuery, "accountState" | "muteStatus"> {
  const accountState = accountStateMap[status];
  if (accountState) return { accountState };
  const muteStatus = muteStatusMap[status];
  if (muteStatus) return { muteStatus };
  return {};
}
