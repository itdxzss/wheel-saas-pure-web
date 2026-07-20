export const DOMAIN_TEMPLATE_CONFLICT_MESSAGE = "该域名已经绑定其他模板";

export interface DomainBinding {
  templateId: number;
}

const DNS_LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;

export function normalizeChannelDomain(input: string): string {
  const authority = input
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\.$/, "");
  if (!authority || /[\/?#@]/.test(authority)) {
    throw new Error("请输入有效域名，仅支持主机名");
  }
  let parsed: URL;
  try {
    parsed = new URL(`https://${authority}`);
  } catch {
    throw new Error("请输入有效域名，仅支持主机名");
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  const isIpLiteral =
    hostname.includes(":") || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname);
  if (authority.includes(":") || parsed.port || isIpLiteral) {
    throw new Error("请输入有效域名，仅支持主机名");
  }
  const labels = hostname.split(".");
  if (
    labels.length < 2 ||
    hostname.length > 253 ||
    labels.some(label => !DNS_LABEL.test(label))
  ) {
    throw new Error("请输入有效域名，仅支持主机名");
  }
  return hostname;
}

export function assertDomainBinding(
  binding: DomainBinding | null,
  templateId: number
): void {
  if (binding && binding.templateId !== templateId) {
    throw new Error(DOMAIN_TEMPLATE_CONFLICT_MESSAGE);
  }
}

export interface RuntimeSource {
  enabled: boolean;
  host: string;
  channelCode: string;
  countryMode: "MIXED" | "SPECIFIC";
  countries: string[];
  selectedCountry?: string;
  initialDialCode: string;
  template: { id: number; assetsUrl: string; runtimeVersion: string };
}

export function resolveChannelRuntime(source: RuntimeSource) {
  if (!source.enabled || !source.channelCode) throw new Error("渠道不可用");
  const countries =
    source.countryMode === "SPECIFIC"
      ? source.selectedCountry
        ? [source.selectedCountry]
        : []
      : [...source.countries];
  if (countries.length === 0) throw new Error("渠道不可用");
  return {
    channelCode: source.channelCode,
    countries,
    initialDialCode: source.initialDialCode,
    template: { ...source.template }
  };
}

export function openSafeChannelLink(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("链接无效");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
    throw new Error("链接无效");
  window.open(parsed.href, "_blank", "noopener,noreferrer");
}
