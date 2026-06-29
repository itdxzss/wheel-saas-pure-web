import { armadaRequest } from "@/api/armada";

export interface AccountGroupApiRow {
  id: number;
  name: string;
  totalAccounts: number;
  onlineAccounts: number;
  abnormalAccounts: number;
  bannedAccounts: number;
  accountCountSummary?: string | null;
  updatedAt: string;
  remark?: string | null;
  systemBuiltin: boolean;
}

export interface AccountGroupWriteRequest {
  name: string;
  remark?: string | null;
}

export interface AccountGroupBatchDeleteResponse {
  deleted_count: number;
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
  riskCount?: number | null;
  bannedCount?: number | null;
  createdAt?: number | null;
  updatedAt?: number | null;
}

function formatEpoch(value?: number | null): string {
  if (!value) return "-";
  return new Date(value).toISOString().replace("T", " ").slice(0, 19);
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
  const abnormalAccounts = row.riskCount ?? 0;
  const bannedAccounts = row.bannedCount ?? 0;
  return {
    id: row.id,
    name: row.name,
    remark: row.remark ?? null,
    totalAccounts,
    onlineAccounts,
    abnormalAccounts,
    bannedAccounts,
    accountCountSummary: `${totalAccounts} - ${onlineAccounts} / ${abnormalAccounts} / ${bannedAccounts}`,
    updatedAt: formatEpoch(row.updatedAt ?? row.createdAt),
    systemBuiltin: row.systemBuiltin === true || row.systemBuiltin === 1
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
