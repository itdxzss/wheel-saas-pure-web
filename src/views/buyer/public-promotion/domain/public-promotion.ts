export type PublicPromotionTemplate =
  | "date-v2"
  | "basic-earn"
  | "basic-party-man";

const DATE_V2_TEMPLATE_CODES = new Set(["base_sex2", "DATE_V2"]);
const BASIC_EARN_TEMPLATE_CODES = new Set(["basic_earn", "BASIC_EARN"]);
const BASIC_PARTY_MAN_TEMPLATE_CODES = new Set([
  "basic_party_man",
  "BASIC_PARTY_MAN"
]);

export function resolvePublicPromotionTemplate(
  templateCode: string
): PublicPromotionTemplate | undefined {
  if (DATE_V2_TEMPLATE_CODES.has(templateCode)) return "date-v2";
  if (BASIC_EARN_TEMPLATE_CODES.has(templateCode)) return "basic-earn";
  if (BASIC_PARTY_MAN_TEMPLATE_CODES.has(templateCode)) {
    return "basic-party-man";
  }
  return undefined;
}
