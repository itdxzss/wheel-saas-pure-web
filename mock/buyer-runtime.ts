export interface MockRuntimeChannel {
  id: number;
  domain: string;
  channelCode: string;
  runtimeVersion: string;
  status: string;
  countryMode: string;
  countries: string[];
  targetCountry: string;
  defaultDialCode: string;
  templateId: number;
  themeColor: string;
  platform: "FACEBOOK" | "TIKTOK" | "KUAISHOU" | "MGSKY";
  pixelId?: string;
  eventLead: string;
  eventInitiateCheckout: string;
  eventCompleteRegistration: string;
  openInApp: boolean;
  joinMarketing: boolean;
}

export interface MockRuntimeTemplate {
  id: number;
  code: string;
  runtimeVersion: string;
  assets?: Record<string, string>;
  params?: Record<string, string | boolean>;
}

const countryDialCodes: Record<string, string> = {
  US: "+1",
  GB: "+44",
  BR: "+55"
};

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
    channelId: item.id,
    channelCode: item.channelCode,
    runtimeVersion: item.runtimeVersion,
    templateId: item.templateId,
    templateVersion: template?.runtimeVersion ?? "",
    templateAssets: template?.assets ?? {
      entry: `/buyer/templates/${template?.code ?? "unknown"}/index.html`
    },
    templateParams: template?.params ?? {},
    countryMode: item.countryMode,
    allowedCountries: (item.countryMode === "SPECIFIC"
      ? [item.targetCountry]
      : item.countries
    ).map(code => ({ code, dialCode: countryDialCodes[code] ?? "" })),
    defaultDialCode: item.defaultDialCode,
    themeColor: item.themeColor,
    platform: item.platform,
    pixelId: item.pixelId,
    eventMappings: {
      lead: item.eventLead,
      loginRequest: item.eventInitiateCheckout,
      loginSuccess: item.eventCompleteRegistration
    },
    appOpenEnabled: item.openInApp,
    marketingEnabled: item.joinMarketing
  };
}
