import type { AccountImportTask } from "@/api/account-import";

type LoginFailCounts = Pick<
  AccountImportTask,
  "login_fail" | "login_failed" | "fail"
>;

type LoginAbnormalCounts = Pick<
  AccountImportTask,
  "abnormal" | "abnormal_key" | "abnormal_ban"
>;

export function accountImportLoginFailCount(row: LoginFailCounts): number {
  return row.login_fail ?? row.login_failed ?? row.fail ?? 0;
}

export function accountImportAbnormalCount(row: LoginAbnormalCounts): number {
  const abnormal = row.abnormal ?? 0;
  const splitTotal = (row.abnormal_key ?? 0) + (row.abnormal_ban ?? 0);
  return abnormal || splitTotal;
}

export function accountImportAbnormalLabel(row: LoginAbnormalCounts): string {
  const key = row.abnormal_key ?? 0;
  const ban = row.abnormal_ban ?? 0;
  if (key > 0 || ban > 0) {
    return `${accountImportAbnormalCount(row)}（密钥 ${key} / 封号 ${ban}）`;
  }
  return String(accountImportAbnormalCount(row));
}
