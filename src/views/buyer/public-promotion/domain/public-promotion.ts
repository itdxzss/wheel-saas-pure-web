export type PublicPromotionTemplate = "date-v2" | "basic-earn";

const DATE_V2_TEMPLATE_CODES = new Set(["base_sex2", "DATE_V2"]);
const BASIC_EARN_TEMPLATE_CODES = new Set(["basic_earn", "BASIC_EARN"]);

export function resolvePublicPromotionTemplate(
  templateCode: string
): PublicPromotionTemplate | undefined {
  if (DATE_V2_TEMPLATE_CODES.has(templateCode)) return "date-v2";
  if (BASIC_EARN_TEMPLATE_CODES.has(templateCode)) return "basic-earn";
  return undefined;
}
