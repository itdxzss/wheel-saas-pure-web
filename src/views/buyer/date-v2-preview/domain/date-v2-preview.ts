export interface DateV2Country {
  code: string;
  name: string;
  dialCode: string;
  minLength: number;
  maxLength: number;
}

export interface DateV2Profile {
  id: string;
  name: string;
  age: number;
  city: string;
  emoji: string;
  gradient: string;
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const PROMOTION_CODE = /^[a-z0-9_-]{6,32}$/i;
const FISSION_CODE = /^\d{1,32}$/;

export interface DateV2LocationInput {
  pathname: string;
  search: string;
}

/** 独立落地页支持“域名/推广码”和“域名/推广码/数字裂变标识”。 */
export function resolveDateV2PathPromotionCode(pathname: string): string {
  const pathSegments = pathname.split("/").filter(Boolean);
  if (pathSegments.length < 1 || pathSegments.length > 2) return "";

  const promotionCode = pathSegments[0]?.trim() ?? "";
  const fissionCode = pathSegments[1]?.trim();
  if (!PROMOTION_CODE.test(promotionCode)) return "";
  if (fissionCode && !FISSION_CODE.test(fissionCode)) return "";
  return promotionCode;
}

/** 开发预览入口兼容 query，生产独立入口不得使用此 query 回退。 */
export function resolveDateV2PromotionCode(
  location: DateV2LocationInput
): string {
  const queryCode = new URLSearchParams(location.search)
    .get("promotionCode")
    ?.trim();
  if (queryCode && PROMOTION_CODE.test(queryCode)) return queryCode;
  return resolveDateV2PathPromotionCode(location.pathname);
}

export function normalizeDateV2ThemeColor(
  value: unknown,
  fallback = "#ff5c74"
): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  return typeof candidate === "string" && HEX_COLOR.test(candidate)
    ? candidate
    : fallback;
}

export function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function validateDateV2Phone(
  value: string,
  country: DateV2Country
): string | undefined {
  const digits = normalizePhoneDigits(value);
  if (!digits) return "请输入 WhatsApp 电话号码";
  if (digits.length < country.minLength || digits.length > country.maxLength) {
    return `请输入有效的${country.name}手机号码`;
  }
  return undefined;
}
