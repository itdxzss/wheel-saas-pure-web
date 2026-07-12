import type { TenantAccountBatchQuery } from "../../../api/account";

export interface AccountQueryRequest {
  id: number;
  filters: TenantAccountBatchQuery;
}

/**
 * 创建账号列表查询状态协调器。
 *
 * 编辑条件由页面表单持有；首次成功查询前不产生已生效快照，之后只保存最后一次成功查询的
 * 条件。请求号阻止旧响应覆盖新列表，已生效版本号用于阻止批量确认期间切换筛选范围。
 */
export function createAccountQueryState() {
  let appliedFilters: TenantAccountBatchQuery | null = null;
  let appliedRevision = 0;
  let latestRequestId = 0;

  return {
    applied: (): TenantAccountBatchQuery | null =>
      appliedFilters === null ? null : { ...appliedFilters },
    hasApplied: (): boolean => appliedFilters !== null,
    appliedRevision: (): number => appliedRevision,
    begin: (filters: TenantAccountBatchQuery): AccountQueryRequest => ({
      id: ++latestRequestId,
      filters: { ...filters }
    }),
    isLatest: (request: AccountQueryRequest): boolean =>
      request.id === latestRequestId,
    commit: (request: AccountQueryRequest): boolean => {
      if (request.id !== latestRequestId) return false;
      appliedFilters = { ...request.filters };
      appliedRevision++;
      return true;
    }
  };
}
