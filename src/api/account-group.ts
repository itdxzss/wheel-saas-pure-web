import { armadaRequest } from "@/api/armada";
import { formatEpochMillis } from "@/utils/time";
import type { MarketingOccupancyDisplayType } from "./account";

export interface AccountGroupApiRow {
  id: number;
  name: string;
  totalAccounts: number;
  onlineAccounts: number;
  /** 状态正常、在线且协议身份完整，可直接参与新建普群的账号数。 */
  executableOnlineAccounts?: number;
  abnormalAccounts: number;
  bannedAccounts: number;
  accountCountSummary?: string | null;
  updatedAt: string;
  remark?: string | null;
  systemBuiltin: boolean;
  marketingOccupancyType?: number | null;
  marketingOccupancyTaskId?: number | null;
  marketingLockedAt?: number | null;
}

export interface AccountGroupWriteRequest {
  name: string;
  remark?: string | null;
}

export interface AccountGroupBatchDeleteResponse {
  deleted_count: number;
}

/** 点击账号分组名称后按需加载的营销整组占用详情。 */
export interface AccountGroupMarketingOccupancy {
  groupId: number;
  occupancyType: MarketingOccupancyDisplayType;
  taskBusinessType?: number | null;
  taskId?: number | null;
  taskName?: string | null;
  taskStatus?: number | null;
  resourceStatus?: number | null;
  lockedAt?: number | null;
  marketingAccountTotalCount: number;
  marketingAccountUsedCount: number;
}

export interface AccountGroupListQuery {
  page?: number;
  page_size?: number;
  pageSize?: number;
  keyword?: string;
  id?: number;
}

export interface PageResponse<T> {
  list?: T[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

interface ArmadaAccountGroupRow {
  id: number;
  name: string;
  remark?: string | null;
  systemBuiltin?: number | boolean | null;
  accountCount?: number | null;
  onlineCount?: number | null;
  executableOnlineCount?: number | null;
  restrictedCount?: number | null;
  riskCount?: number | null;
  bannedCount?: number | null;
  createdAt?: number | null;
  updatedAt?: number | null;
  marketingOccupancyType?: number | null;
  marketingOccupancyTaskId?: number | null;
  marketingLockedAt?: number | null;
}

function toQuery(params: AccountGroupListQuery) {
  return {
    page: params.page,
    pageSize: params.pageSize ?? params.page_size,
    keyword: params.keyword,
    id: params.id
  };
}

function toAccountGroupRow(row: ArmadaAccountGroupRow): AccountGroupApiRow {
  const totalAccounts = row.accountCount ?? 0;
  const onlineAccounts = row.onlineCount ?? 0;
  const executableOnlineAccounts = row.executableOnlineCount ?? 0;
  const abnormalAccounts = row.restrictedCount ?? row.riskCount ?? 0;
  const bannedAccounts = row.bannedCount ?? 0;
  return {
    id: row.id,
    name: row.name,
    remark: row.remark ?? null,
    totalAccounts,
    onlineAccounts,
    executableOnlineAccounts,
    abnormalAccounts,
    bannedAccounts,
    accountCountSummary: `${totalAccounts} - ${onlineAccounts} / ${abnormalAccounts} / ${bannedAccounts}`,
    updatedAt: formatEpochMillis(row.updatedAt ?? row.createdAt),
    systemBuiltin: row.systemBuiltin === true || row.systemBuiltin === 1,
    marketingOccupancyType: row.marketingOccupancyType ?? null,
    marketingOccupancyTaskId: row.marketingOccupancyTaskId ?? null,
    marketingLockedAt: row.marketingLockedAt ?? null
  };
}

export function listAccountGroups(
  params: AccountGroupListQuery = {}
): Promise<PageResponse<AccountGroupApiRow>> {
  return armadaRequest<PageResponse<ArmadaAccountGroupRow>>(
    "get",
    "/api/account-groups",
    { params: toQuery(params) }
  ).then(result => ({
    ...result,
    list: result.list?.map(toAccountGroupRow) ?? []
  }));
}

/**
 * 查询单个账号分组的营销占用详情。
 *
 * 该接口仅在用户点击分组标签时调用，账号列表分页加载不会逐行请求。
 */
export function getAccountGroupMarketingOccupancy(
  groupId: number
): Promise<AccountGroupMarketingOccupancy> {
  return armadaRequest<AccountGroupMarketingOccupancy>(
    "get",
    `/api/account-groups/${groupId}/marketing-occupancy`
  );
}

export function createAccountGroup(
  data: AccountGroupWriteRequest
): Promise<AccountGroupApiRow> {
  return armadaRequest<ArmadaAccountGroupRow>("post", "/api/account-groups", {
    data
  }).then(toAccountGroupRow);
}

export function updateAccountGroup(
  id: number,
  data: AccountGroupWriteRequest
): Promise<void> {
  return armadaRequest<void>("put", `/api/account-groups/${id}`, { data });
}

export function batchDeleteAccountGroups(
  ids: number[]
): Promise<AccountGroupBatchDeleteResponse> {
  return armadaRequest<number>("post", "/api/account-groups/batch-delete", {
    data: { ids }
  }).then(count => ({ deleted_count: count ?? 0 }));
}

export function splitAccountGroup(
  groupId: number,
  groupCount: number
): Promise<void> {
  return armadaRequest<void>("post", "/api/account-groups/split", {
    data: { groupId, groupCount }
  });
}

export function mergeAccountGroups(groupIds: number[]): Promise<void> {
  return armadaRequest<void>("post", "/api/account-groups/merge", {
    data: { groupIds }
  });
}
