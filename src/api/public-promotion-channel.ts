import axios from "axios";
import type { ArmadaResp } from "@/api/armada";
import type { BuyerChannelRuntimeConfig } from "@/api/buyer-channel";

export type PublicPromotionPairingStatus =
  | "REQUESTING"
  | "WAITING_CONFIRMATION"
  | "FINALIZING"
  | "SUCCEEDED"
  | "FAILED"
  | "EXPIRED";

export interface PublicPromotionPairingCreated {
  sessionToken: string;
  status: PublicPromotionPairingStatus;
  expiresAt: number;
}

export interface PublicPromotionPairingState {
  status: PublicPromotionPairingStatus;
  pairingCode: string | null;
  expiresAt: number | null;
  accountId: number | null;
  errorCode: string | null;
  errorMessage: string | null;
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

/** 创建 WhatsApp 配对会话。sessionToken 只保存在落地页内存中。 */
export async function createPublicPromotionPairingSession(
  channelCode: string,
  phone: string
): Promise<PublicPromotionPairingCreated> {
  const response = await publicClient.post<
    ArmadaResp<PublicPromotionPairingCreated>
  >(
    `/api/public/promotion-channels/${encodeURIComponent(channelCode)}/pairing-sessions`,
    { phone }
  );
  if (!response.data || response.data.code !== 0) {
    throw new Error(response.data?.message ?? "创建配对会话失败");
  }
  return response.data.data;
}

/** 使用一次性令牌查询配对状态，不把协议层凭据暴露给浏览器。 */
export async function getPublicPromotionPairingSessionStatus(
  sessionToken: string
): Promise<PublicPromotionPairingState> {
  const response = await publicClient.get<
    ArmadaResp<PublicPromotionPairingState>
  >("/api/public/promotion-pairing-sessions/status", {
    headers: {
      "X-Pairing-Session-Token": sessionToken
    }
  });
  if (!response.data || response.data.code !== 0) {
    throw new Error(response.data?.message ?? "查询配对状态失败");
  }
  return response.data.data;
}
