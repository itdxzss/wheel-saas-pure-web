import axios from "axios";
import type { ArmadaResp } from "@/api/armada";
import type { BuyerChannelRuntimeConfig } from "@/api/buyer-channel";

export interface PublicWhatsAppPairingPayload {
  channelCode: string;
  countryCode: string;
  dialCode: string;
  phone: string;
}

export interface PublicWhatsAppPairingResult {
  requestId: string;
  pairingCode: string;
  expiresInSeconds: number;
}

const publicClient = axios.create({
  timeout: 10000,
  headers: {
    Accept: "application/json"
  }
});

/** 独立落地页使用的无登录态公共接口，不加载管理后台 store 和鉴权刷新逻辑。 */
export async function getPublicPromotionChannelRuntime(
  channelCode: string
): Promise<BuyerChannelRuntimeConfig> {
  const response = await publicClient.get<
    ArmadaResp<BuyerChannelRuntimeConfig>
  >(
    `/api/public/promotion-channels/runtime/${encodeURIComponent(channelCode)}`
  );
  if (!response.data || response.data.code !== 0) {
    throw new Error(response.data?.message ?? "推广链接不可用");
  }
  return response.data.data;
}
