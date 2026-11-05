import { armadaRequest } from "@/api/armada";
import type { PageResponse } from "@/api/account-group";
import type {
  AccountRegistrationPriceTier,
  RegistrationPrice
} from "@/api/account-registration";

/** 后台手动接码合同；号码与验证码只在本页展示，不写日志。 */
export type SmsActivationState =
  | "WAITING_CODE"
  | "RECEIVED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

/** 订单的 Go 注册办理状态；后台定时任务推进，页面只展示。 */
export type SmsRegistrationState =
  | "REQUESTING"
  | "WAITING_CODE"
  | "VERIFYING"
  | "REGISTERED"
  | "ACTION_REQUIRED";

/** 1 个人版，2 WhatsApp Business 手机客户端。 */
export type SmsRegistrationAccountType = 1 | 2;

export interface SmsActivationOptions {
  serviceCode: string;
  countries: Array<{ id: string; name: string }>;
  balance?: RegistrationPrice | null;
  purchaseEnabled: boolean;
  disabledReason?: string | null;
  /** 当前租户能否对订单点“开始注册”。 */
  registrationEnabled: boolean;
  registrationAccountTypes: SmsRegistrationAccountType[];
  registrationDisabledReason?: string | null;
}

export interface SmsActivationRequest {
  countryId: string;
  maxPrice: string;
  providerId?: string | null;
}

export interface SmsActivation {
  id: number;
  activationId: string;
  phoneNumber: string;
  countryId: string;
  cost: RegistrationPrice;
  currency: number;
  state: SmsActivationState;
  smsCode?: string | null;
  receivedAt?: number | null;
  cancelAfter: number;
  expiresAt: number;
  createdBy?: number | null;
  createdAt: number;
  updatedAt: number;
  /** 没点过“开始注册”时为空。 */
  registrationState?: SmsRegistrationState | null;
  /** 开始注册时冻结的类型，后续轮询只读。 */
  registrationAccountType?: SmsRegistrationAccountType | null;
  /** 办理进入“需处理”时的固定原因码，其它状态为空串。 */
  registrationFailure?: string | null;
}

/** 读取美国渠道目录、平台余额和取号开关。 */
export function getSmsActivationOptions(): Promise<SmsActivationOptions> {
  return armadaRequest("get", "/api/sms-activations/options");
}

/** 读取某个渠道的价格档位与库存快照。 */
export function getSmsActivationPriceTiers(
  countryId: string
): Promise<AccountRegistrationPriceTier[]> {
  return armadaRequest("get", "/api/sms-activations/price-tiers", {
    params: { countryId }
  });
}

/** 同步取一个号；结果不明时后端不会重试，前端也不自动重发。 */
export function createSmsActivation(
  data: SmsActivationRequest
): Promise<SmsActivation> {
  return armadaRequest("post", "/api/sms-activations", { data });
}

/** 分页读取当前租户接码记录。 */
export function listSmsActivations(
  page: number,
  pageSize: number
): Promise<PageResponse<SmsActivation>> {
  return armadaRequest("get", "/api/sms-activations", {
    params: { page, pageSize }
  });
}

/** 读取一条记录；等码中时后端会向平台刷新一次。 */
export function getSmsActivation(id: number): Promise<SmsActivation> {
  return armadaRequest("get", `/api/sms-activations/${id}`);
}

/** 对等码订单开始 Go 注册；后台自动发码、等码、验码，重复点击返回已有办理记录。 */
export function startSmsRegistration(
  id: number,
  accountType: SmsRegistrationAccountType
): Promise<SmsActivation> {
  return armadaRequest("post", `/api/sms-activations/${id}/registration`, {
    data: { accountType }
  });
}

/** 已收码后通知平台完成。 */
export function completeSmsActivation(id: number): Promise<SmsActivation> {
  return armadaRequest("post", `/api/sms-activations/${id}/complete`);
}

/** 等码中且到达可取消时间后通知平台取消。 */
export function cancelSmsActivation(id: number): Promise<SmsActivation> {
  return armadaRequest("post", `/api/sms-activations/${id}/cancel`);
}
