export type BuyerTemplatePreviewKind = "date-v2" | "basic-earn";

const templatePreviewKinds: Readonly<Record<string, BuyerTemplatePreviewKind>> =
  {
    base_sex2: "date-v2",
    basic_earn: "basic-earn"
  };

export function resolveBuyerTemplatePreviewKind(
  templateCode: string | null | undefined
): BuyerTemplatePreviewKind | undefined {
  return templatePreviewKinds[templateCode?.trim().toLowerCase() ?? ""];
}
