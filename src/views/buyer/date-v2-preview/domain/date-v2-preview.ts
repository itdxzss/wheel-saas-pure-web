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

export interface DateV2LocationInput {
  pathname: string;
  search: string;
}

/** 独立落地页只允许从“域名/推广码”的路径中读取渠道码。 */
export function resolveDateV2PathPromotionCode(pathname: string): string {
  const pathSegments = pathname.split("/").filter(Boolean);
  const pathCode = pathSegments.length === 1 ? pathSegments[0].trim() : "";
  return PROMOTION_CODE.test(pathCode) ? pathCode : "";
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
