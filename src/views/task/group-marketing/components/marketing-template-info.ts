export function marketingTemplateValue(value?: string | null): string {
  return value?.trim() ? value : "—";
}

export function marketingTemplateSummary(
  content?: string | null,
  bodyText?: string | null
): string {
  const parts = [content, bodyText]
    .map(value => value?.trim() || "")
    .filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "—";
}

export function marketingPromotionLink(value?: string | null): string {
  return value?.trim() || "";
}

export function marketingPromotionHref(
  value?: string | null
): string | undefined {
  const link = marketingPromotionLink(value);
  if (!link) return undefined;
  try {
    const url = new URL(link);
    return (url.protocol === "http:" || url.protocol === "https:") &&
      Boolean(url.hostname)
      ? link
      : undefined;
  } catch {
    return undefined;
  }
}
