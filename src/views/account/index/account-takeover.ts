import type { TenantAccount } from "../../../api/account";

export const TAKEOVER_EMPTY_SELECTION_MESSAGE = "请先选择账号";
export const TAKEOVER_SELECTION_MESSAGE =
  "当前所选账号存在非被抢登状态，请重新选择";
export const TAKING_OVER_ONLINE_MESSAGE = "账号抢登中，请先离线";

type TakeoverSelectableAccount = Pick<
  TenantAccount,
  "account_state" | "mute_status"
>;
type OnlineGuardAccount = Pick<TenantAccount, "account_state">;

/**
 * 一键抢登只允许从“被抢登”事实状态进入“抢登中”。
 *
 * 禁言账号虽然底层 account_state 可能仍是被抢登，但列表展示优先显示禁言，
 * 后端也会按 mute_status 拦截，所以前端保持同样口径。
 */
export function isTakeoverCandidate(row: TakeoverSelectableAccount): boolean {
  return row.account_state === 6 && !row.mute_status;
}

export function takeoverBatchDisabledTip(
  rows: TakeoverSelectableAccount[]
): string {
  if (rows.length === 0) return TAKEOVER_EMPTY_SELECTION_MESSAGE;
  return rows.every(isTakeoverCandidate) ? "" : TAKEOVER_SELECTION_MESSAGE;
}

export function isTakingOverAccount(row: OnlineGuardAccount): boolean {
  return row.account_state === 7;
}

export function onlineBlockedTip(rows: OnlineGuardAccount[]): string {
  return rows.some(isTakingOverAccount) ? TAKING_OVER_ONLINE_MESSAGE : "";
}
