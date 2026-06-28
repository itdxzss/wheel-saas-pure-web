import { armadaRequest } from "@/api/armada";
import type { PageResponse } from "@/api/account";

interface IpProxyRow {
  region?: string | null;
}

export async function listTenantIpRegions(): Promise<string[]> {
  const result = await armadaRequest<PageResponse<IpProxyRow>>(
    "get",
    "/api/ip-proxies",
    { params: { page: 1, pageSize: 500 } }
  );
  return Array.from(
    new Set(
      (result.list ?? [])
        .map(row => row.region?.trim())
        .filter((region): region is string => Boolean(region))
    )
  );
}
