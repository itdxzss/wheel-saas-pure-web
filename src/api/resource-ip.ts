import { http } from "@/utils/http";
import type { ApiResponse } from "@/api/account";

export function listTenantIpRegions(): Promise<ApiResponse<string[]>> {
  return http.request<ApiResponse<string[]>>(
    "get",
    "/api/tenant/resource/ip-proxies/regions"
  );
}
