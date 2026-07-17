export interface MockRuntimeChannel {
  domain: string;
  channelCode: string;
  status: string;
  countryMode: string;
  countries: string[];
  targetCountry: string;
  defaultDialCode: string;
  templateId: number;
}

export interface MockRuntimeTemplate {
  id: number;
  code: string;
  runtimeVersion: string;
}

export function resolveMockBuyerRuntime(
  channels: MockRuntimeChannel[],
  templates: MockRuntimeTemplate[],
  host: string,
  channelCode: string
) {
  const normalizedHost = host
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\.$/, "")
    .toLowerCase();
  const item = channels.find(
    candidate =>
      candidate.domain === normalizedHost &&
      candidate.channelCode === channelCode &&
      candidate.status === "ENABLED"
  );
  if (!item) return null;
  const template = templates.find(
    candidate => candidate.id === item.templateId
  );
  return {
    channelCode: item.channelCode,
    countries:
      item.countryMode === "SPECIFIC"
        ? [item.targetCountry]
        : [...item.countries],
    initialDialCode: item.defaultDialCode,
    template: {
      id: item.templateId,
      assetsUrl: `/buyer/templates/${template?.code ?? "unknown"}`,
      runtimeVersion: template?.runtimeVersion ?? ""
    }
  };
}
