import { armadaRequest } from "@/api/armada";
import type { PageResponse } from "@/api/account";
import {
  normalizeIpProxyRow,
  proxyTypeToProtocol,
  toIpProxyListParams,
  type BackendIpProxyRow,
  type IpManageRow,
  type IpProxyListQuery,
  type ProxyTypeLabel
} from "@/api/resource-ip-mapping";

export interface IpProxyImportInput {
  country: string;
  proxyType: ProxyTypeLabel;
  source: string;
  text: string;
}

export interface IpProxyImportResult {
  totalRows: number;
  insertedRows: number;
  skippedRows: number;
  failedRows: number;
  errors: string[];
}

export function listIpProxies(
  query: IpProxyListQuery = {}
): Promise<PageResponse<IpManageRow>> {
  return armadaRequest<PageResponse<BackendIpProxyRow>>(
    "get",
    "/api/ip-proxies",
    { params: toIpProxyListParams(query) }
  ).then(result => ({
    ...result,
    list: result.list?.map(normalizeIpProxyRow) ?? []
  }));
}

export function importIpProxies(
  input: IpProxyImportInput
): Promise<IpProxyImportResult> {
  return armadaRequest<IpProxyImportResult>("post", "/api/ip-proxies/import", {
    data: {
      region: input.country,
      protocol: proxyTypeToProtocol(input.proxyType),
      source: input.source,
      text: input.text
    }
  });
}

export function batchDeleteIpProxies(ids: number[]): Promise<void> {
  return armadaRequest<void>("post", "/api/ip-proxies/batch-delete", {
    data: { ids }
  });
}

export async function listTenantIpRegions(): Promise<string[]> {
  const result = await listIpProxies({ page: 1, pageSize: 500 });
  return Array.from(
    new Set(
      (result.list ?? [])
        .map(row => row.country.trim())
        .filter((region): region is string => Boolean(region))
    )
  );
}
