import { armadaRequest } from "@/api/armada";
import type { PageResponse } from "@/api/account-group";

/** 查询方式：1 每个号查自己，2 探针号代查。 */
export type TierCheckMode = 1 | 2;

export interface TierCheckStats {
  total: number;
  success: number;
  failed: number;
  unqueryable: number;
  pending: number;
  first: number;
  same: number;
  up: number;
  down: number;
  unknown: number;
  lost: number;
}

export interface TierCheckTask {
  id: number;
  name: string;
  mode: TierCheckMode;
  sourceTaskId?: number | null;
  sourceTaskName?: string | null;
  totalCount: number;
  /** 1 执行中；2 已停止；3 已完成；4 部分失败。 */
  status: number;
  createdAt: number;
  finishedAt?: number | null;
  /** 本批成功快照里各档位的号数，键是服务器返回的档位字符串。 */
  tierCounts: Record<string, number>;
  stats: TierCheckStats;
}

export interface TierCheckItem {
  id: number;
  accountId: number;
  phone: string;
  /** 服务器认定的类型：PERSONAL / BUSINESS。 */
  serverUserType?: string | null;
  trustTier?: string | null;
  prevTrustTier?: string | null;
  prevCheckedAt?: number | null;
  /** 0 首次；1 不变；2 上升；3 下降；4 变化但方向不明；5 本次未查到。 */
  tierChange: number;
  /** 1 待查；2 查询中；3 成功；4 失败；5 不可查；6 已取消。 */
  status: number;
  reasonCode?: string | null;
  joinDateMs?: number | null;
  phoneCountryCode?: string | null;
  checkedAt?: number | null;
}

export interface TierCheckRequest {
  /** 与 accountIds 二选一；空数组不表示全部账号。 */
  accountGroupIds?: number[];
  accountIds?: number[];
  includePersonal: boolean;
  mode: TierCheckMode;
  probeAccountIds: number[];
  name?: string;
  sourceTaskId?: number;
  requestId?: string;
  previewToken?: string;
}

export interface TierCheckPreview {
  eligible: number;
  excluded: number;
  excludedReasons: { reason: string; count: number }[];
  previewToken: string;
}

export interface TierCheckListQuery {
  page: number;
  pageSize: number;
  keyword?: string;
  mode?: TierCheckMode;
  status?: number;
}

export interface TierCheckTimelineEntry {
  itemId: number;
  taskId: number;
  taskName: string;
  mode: TierCheckMode;
  checkedAt: number;
  trustTier?: string | null;
  prevTrustTier?: string | null;
  tierChange: number;
  status: number;
  reasonCode?: string | null;
}

export interface TierCheckAccountHistory {
  accountId: number;
  phone: string;
  serverUserType?: string | null;
  phoneCountryCode?: string | null;
  joinDateMs?: number | null;
  mvSubscribed?: boolean | null;
  entries: TierCheckTimelineEntry[];
}

const base = "/api/accounts/tier-check-tasks";

export const previewTierCheck = (data: TierCheckRequest) =>
  armadaRequest<TierCheckPreview>("post", `${base}/preview`, { data });
export const createTierCheck = (data: TierCheckRequest) =>
  armadaRequest<TierCheckTask>("post", base, { data });
export const listTierChecks = (params: TierCheckListQuery) =>
  armadaRequest<PageResponse<TierCheckTask>>("get", base, { params });
export const getTierCheck = (id: number) =>
  armadaRequest<TierCheckTask>("get", `${base}/${id}`);
export const listTierCheckItems = (
  id: number,
  page: number,
  filter?: "changed" | "lost"
) =>
  armadaRequest<PageResponse<TierCheckItem>>("get", `${base}/${id}/items`, {
    params: { page, pageSize: 20, filter }
  });
export const stopTierCheck = (id: number) =>
  armadaRequest<void>("post", `${base}/${id}/stop`);
export const retryTierCheck = (id: number) =>
  armadaRequest<number>("post", `${base}/${id}/retry-failed`);
export const recheckTierCheck = (id: number) =>
  armadaRequest<TierCheckTask>("post", `${base}/${id}/recheck`);
export const getAccountTierHistory = (accountId: number) =>
  armadaRequest<TierCheckAccountHistory>(
    "get",
    `/api/accounts/${accountId}/tier-history`
  );
