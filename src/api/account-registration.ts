import { armadaRequest } from "@/api/armada";
import type { PageResponse } from "@/api/account-group";
import type { AccountImportIpAllocationMode } from "@/api/account-import";

/** Armada 接码注册合同；价格保留供应商原值，不默认币种。 */
export type RegistrationPrice = string | number;

export interface AccountRegistrationCatalog {
  serviceCode: string;
  serviceName: string;
  countries: Array<{ id: string; name: string }>;
  orderingEnabled: boolean;
  disabledReason?: string | null;
}

export interface AccountRegistrationPriceTier {
  country: string;
  service: string;
  cost: RegistrationPrice;
  count: number;
  providerIds: string[];
}

export interface AccountRegistrationRequest {
  requestId: string;
  countryId: string;
  unitPrice: string;
  quantity: number;
  accountGroupId: number;
  accountType: 1 | 2;
  ipAllocationMode: AccountImportIpAllocationMode;
  ipRegion?: string;
}

export interface AccountRegistrationTask
  extends Omit<AccountRegistrationRequest, "unitPrice"> {
  id: number;
  unitPrice: RegistrationPrice;
  cancelRequested: boolean;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "REVIEW_REQUIRED" | "CANCELLED";
  createdAt: number;
  updatedAt: number;
  counts: {
    pending: number;
    processing: number;
    succeeded: number;
    failed: number;
    unknown: number;
    cancelled: number;
  };
}

export type AccountRegistrationItemState =
  | "PENDING"
  | "PURCHASING"
  | "WAITING_CODE"
  | "REGISTERING"
  | "IMPORTING"
  | "WAITING_ONLINE"
  | "SUCCEEDED"
  | "FAILED"
  | "UNKNOWN"
  | "CANCELLED";

export interface AccountRegistrationItem {
  id: number;
  ordinal: number;
  state: AccountRegistrationItemState;
  activationId?: string | null;
  phoneNumber?: string | null;
  actualCost?: RegistrationPrice | null;
  currency?: number | null;
  registrationId?: string | null;
  importBatchId?: number | null;
  accountId?: number | null;
  failureCode?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface AccountRegistrationDetail {
  task: AccountRegistrationTask;
  items: AccountRegistrationItem[];
}

/** 读取服务端已筛选的美国渠道目录与采购开关。 */
export function getAccountRegistrationCatalog(): Promise<AccountRegistrationCatalog> {
  return armadaRequest("get", "/api/account-registrations/catalog");
}

/** 读取某个渠道的当前价格、库存和供应商快照。 */
export function getAccountRegistrationPriceTiers(
  countryId: string
): Promise<AccountRegistrationPriceTier[]> {
  return armadaRequest("get", "/api/account-registrations/price-tiers", {
    params: { countryId }
  });
}

/** 使用固定 requestId 提交；结果未知时只能重放同一请求。 */
export function createAccountRegistration(
  data: AccountRegistrationRequest
): Promise<AccountRegistrationDetail> {
  return armadaRequest("post", "/api/account-registrations", { data });
}

/** 分页读取当前租户的注册任务。 */
export function listAccountRegistrations(
  page: number,
  pageSize: number
): Promise<PageResponse<AccountRegistrationTask>> {
  return armadaRequest("get", "/api/account-registrations", {
    params: { page, pageSize }
  });
}

/** 读取任务及逐条执行状态。 */
export function getAccountRegistration(
  id: number
): Promise<AccountRegistrationDetail> {
  return armadaRequest("get", `/api/account-registrations/${id}`);
}

/** 仅停止尚未采购的项，已采购项继续收尾。 */
export function cancelAccountRegistration(
  id: number
): Promise<AccountRegistrationDetail> {
  return armadaRequest("post", `/api/account-registrations/${id}/cancel`);
}
