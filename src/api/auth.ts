import { armadaRequest } from "./armada";

/** armada 登录出参。token 为占位串(先测,无 JWT)。 */
export interface TenantLoginResult {
  tenantCode: string;
  tenantName: string;
  token: string;
}

/** 租户登录(免鉴权公开接口)。 */
export const loginTenant = (data: { tenantCode: string; password: string }) =>
  armadaRequest<TenantLoginResult>("post", "/api/public/auth/login", { data });
