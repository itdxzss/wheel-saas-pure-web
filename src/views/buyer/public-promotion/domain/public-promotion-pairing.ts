import type { PublicPromotionPairingStatus } from "@/api/public-promotion-channel";

export interface PublicPromotionPairingInput {
  channelCode: string;
  dialCode: string;
  phone: string;
}

export interface PublicPromotionAttribution {
  fbp?: string;
  fbc?: string;
  sourceUrl?: string;
}

const META_BROWSER_ID_MAX_LENGTH = 255;
const SOURCE_URL_MAX_LENGTH = 2048;
const META_BROWSER_ID_PATTERN = /^[A-Za-z0-9._-]+$/;
const FBCLID_PATTERN = /^[A-Za-z0-9._~-]{1,200}$/;

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

function cookieValue(cookieHeader: string, name: string): string | undefined {
  const prefix = `${name}=`;
  return cookieHeader
    .split(";")
    .map(item => item.trim())
    .find(item => item.startsWith(prefix))
    ?.slice(prefix.length);
}

function validMetaBrowserId(value?: string): string | undefined {
  if (
    !value ||
    value.length > META_BROWSER_ID_MAX_LENGTH ||
    !META_BROWSER_ID_PATTERN.test(value)
  ) {
    return undefined;
  }
  return value;
}

function validSourceUrl(value: string): URL | undefined {
  if (!value || value.length > SOURCE_URL_MAX_LENGTH) return undefined;
  try {
    const url = new URL(value);
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.username ||
      url.password
    ) {
      return undefined;
    }
    url.hash = "";
    return url;
  } catch {
    return undefined;
  }
}

/**
 * 从当前公开落地页提取可选 Meta 浏览器归因信息。
 * 任何非法或缺失字段都会被忽略，不会阻止原有配对流程。
 */
export function resolvePublicPromotionAttribution(
  cookieHeader: string,
  currentUrl: string,
  now: number
): PublicPromotionAttribution {
  const sourceUrl = validSourceUrl(currentUrl);
  if (!sourceUrl) return {};

  const fbp = validMetaBrowserId(cookieValue(cookieHeader, "_fbp"));
  const cookieFbc = validMetaBrowserId(cookieValue(cookieHeader, "_fbc"));
  const fbclid = sourceUrl.searchParams.get("fbclid") ?? "";
  const generatedFbc = FBCLID_PATTERN.test(fbclid)
    ? `fb.1.${Math.trunc(now)}.${fbclid}`
    : undefined;
  const fbc = cookieFbc ?? validMetaBrowserId(generatedFbc);

  return {
    ...(fbp ? { fbp } : {}),
    ...(fbc ? { fbc } : {}),
    sourceUrl: sourceUrl.toString()
  };
}
