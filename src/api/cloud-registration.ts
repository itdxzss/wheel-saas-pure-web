import { armadaRequest } from "@/api/armada";

/** 后端当前租户已绑定的云手机；不包含令牌，不代表在线。 */
export interface CloudRegistrationDevice {
  deviceId: string;
  cloudPhoneId: string;
  displayName: string;
}
export function getCloudRegistrationDevices(): Promise<
  CloudRegistrationDevice[]
> {
  return armadaRequest("get", "/api/account-registrations/cloud-phones");
}
