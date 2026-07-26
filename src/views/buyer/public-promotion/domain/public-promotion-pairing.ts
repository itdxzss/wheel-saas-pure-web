import type { PublicPromotionPairingStatus } from "@/api/public-promotion-channel";

export interface PublicPromotionPairingInput {
  channelCode: string;
  dialCode: string;
  phone: string;
}

const terminalStatuses = new Set<PublicPromotionPairingStatus>([
  "SUCCEEDED",
  "FAILED",
  "EXPIRED"
]);

/** 后端只接受包含国际区号的 10~15 位纯数字号码。 */
export function normalizePublicPromotionPairingPhone(
  dialCode: string,
  phone: string
): string {
  return `${dialCode}${phone}`.replace(/\D/g, "");
}

export function validatePublicPromotionPairingPhone(
  phone: string
): string | undefined {
  if (!/^\d{10,15}$/.test(phone)) {
    return "请输入包含国际区号的 10～15 位手机号码";
  }
  return undefined;
}

export function isTerminalPublicPromotionPairingStatus(
  status: PublicPromotionPairingStatus
): boolean {
  return terminalStatuses.has(status);
}
