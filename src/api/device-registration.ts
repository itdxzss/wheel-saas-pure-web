import { armadaRequest } from "@/api/armada";
import type { RegistrationPrice } from "@/api/account-registration";

/** 控端一次手机采购许可；不包含手机令牌或供应商密钥。 */
export interface DeviceRegistrationSetup {
  requestId: string;
  deviceId: string;
  countryId: string;
  unitPrice: string;
  providerId: string | null;
  expiresAt: number;
}

/** 当前许可状态，控端响应不包含验证码。 */
export interface DeviceRegistrationStatus {
  requestId: string;
  state: string;
  phoneNumber: string;
  unitPrice: RegistrationPrice;
  countryId: string;
  purchaseBefore: number;
  purchaseAttempts?: number;
  nextPurchaseAt?: number | null;
  failureCode: string;
  providerId: string | null;
  replacesRequestId: string | null;
  actualCost: RegistrationPrice | null;
  currency: number | null;
}

/** 保存许可本身不采购。 */
export function prepareDeviceRegistration(
  data: DeviceRegistrationSetup
): Promise<DeviceRegistrationStatus> {
  return armadaRequest("post", "/api/account-registrations/devices", { data });
}

/** 只读查询，不轮询接码平台。 */
export function getDeviceRegistration(
  deviceId: string
): Promise<DeviceRegistrationStatus> {
  return armadaRequest(
    "get",
    `/api/account-registrations/devices/${encodeURIComponent(deviceId)}`
  );
}

/** 用户明确确认后发起一笔采购；重复发送同请求恢复原任务。 */
export function startDeviceRegistration(
  deviceId: string,
  data: { requestId: string; providerId: string }
): Promise<DeviceRegistrationStatus> {
  return armadaRequest(
    "post",
    `/api/account-registrations/devices/${encodeURIComponent(deviceId)}/start`,
    { data }
  );
}
