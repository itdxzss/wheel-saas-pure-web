export type MarketingButtonLinkValidationMessage =
  | ""
  | "请输入跳转链接"
  | "请输入标准的跳转链接";

const HTTP_URL_PATTERN = /^https?:\/\//i;
const EXPLICIT_SCHEME_PATTERN = /^[a-z][a-z\d+.-]*:\/\//i;
const ILLEGAL_URL_CHARACTER_PATTERN = /[\u0000-\u0020\u007f-\uffff<>"{}|\\^`]/;
const HOST_LABEL_PATTERN = /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i;

function hasStandardHostname(hostname: string): boolean {
  const normalized = hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (normalized === "localhost" || normalized.includes(":")) return true;
  const labels = normalized.split(".");
  return (
    labels.length >= 2 && labels.every(label => HOST_LABEL_PATTERN.test(label))
  );
}

export function validateMarketingButtonLink(
  value: string
): MarketingButtonLinkValidationMessage {
  const trimmed = value.trim();
  if (!trimmed) return "请输入跳转链接";
  if (
    trimmed !== value ||
    ILLEGAL_URL_CHARACTER_PATTERN.test(trimmed) ||
    (EXPLICIT_SCHEME_PATTERN.test(trimmed) && !HTTP_URL_PATTERN.test(trimmed))
  ) {
    return "请输入标准的跳转链接";
  }
  try {
    const url = new URL(
      HTTP_URL_PATTERN.test(trimmed) ? trimmed : `https://${trimmed}`
    );
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.username ||
      url.password ||
      !hasStandardHostname(url.hostname)
    ) {
      return "请输入标准的跳转链接";
    }
    return "";
  } catch {
    return "请输入标准的跳转链接";
  }
}

export type MarketingPromotionLinkValidationMessage =
  | ""
  | "请输入标准的推广链接";

export function validateMarketingPromotionLink(
  value: string
): MarketingPromotionLinkValidationMessage {
  if (!value.trim()) return "";
  const message = validateMarketingButtonLink(value);
  if (!message) return "";
  return "请输入标准的推广链接";
}

/** 图片链接卡片必须有真实图片选择及带 HTTP(S) 协议的推广链接。 */
export function validateMarketingImageLink(
  hasImage: boolean,
  promotionLink: string | null | undefined
): string {
  if (!hasImage) return "图片链接卡片必须选择图片";
  const url = promotionLink?.trim() ?? "";
  if (!HTTP_URL_PATTERN.test(url) || validateMarketingPromotionLink(url)) {
    return "图片链接卡片必须配置有效的推广链接（http:// 或 https://）";
  }
  return "";
}
