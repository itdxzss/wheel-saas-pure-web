import { armadaRequest } from "@/api/armada";

export type ChannelPlatform = "FACEBOOK" | "TIKTOK" | "KUAISHOU" | "MGSKY";
export type ChannelStatus = "ENABLED" | "DISABLED";
export type CountryMode = "MIXED" | "SPECIFIC";

export interface BuyerChannelOptions {
  uploadFee: { label: string; value: number };
  platforms: Array<{ label: string; value: ChannelPlatform }>;
  eventOptions: Array<{ label: string; value: string }>;
  countries: Array<{
    code: string;
    name: string;
    dialCode: string;
    flag?: string;
  }>;
  templates: Array<{ id: number; name: string }>;
  owners: Array<{ id: number; name: string }>;
  creators: Array<{ id: number; name: string }>;
  parentUsers: Array<{ id: number; name: string }>;
}

export interface BuyerChannelRow {
  id: number;
  name: string;
  channelCode: string;
  targetCountry: string;
  targetCountryIso2?: string;
  mixedTargetCountry: boolean;
  templateId: number;
  templateName: string;
  platform: ChannelPlatform;
  domainStatus: string;
  promotionUrl: string;
  fissionUrl: string;
  defaultDialCode: string;
  preselectedCountryIso2?: string;
  status: ChannelStatus;
  creatorName: string;
  createdAt: string;
}

export interface BuyerChannelDetail {
  id: number;
  name: string;
  ownerId?: number;
  targetCountry: string;
  countryMode?: CountryMode;
  templateId: number;
  themeColor?: string;
  domain: string;
  preselectedCountry?: string;
  defaultDialCode: string;
  platform: ChannelPlatform;
  pixelId?: string;
  accessTokenConfigured: boolean;
  eventLead?: string;
  eventInitiateCheckout?: string;
  eventCompleteRegistration?: string;
  openInApp?: boolean;
  joinMarketing?: boolean;
  status: ChannelStatus;
}

export interface BuyerChannelPayload {
  name: string;
  ownerId?: number;
  targetCountry: string;
  countryMode: CountryMode;
  templateId: number;
  themeColor: string;
  domain: string;
  preselectedCountry: string;
  defaultDialCode: string;
  platform: ChannelPlatform;
  pixelId?: string;
  accessToken?: string;
  eventLead: string;
  eventInitiateCheckout: string;
  eventCompleteRegistration: string;
  openInApp: boolean;
  joinMarketing: boolean;
  status: ChannelStatus;
}

export interface BuyerChannelQuery {
  page: number;
  page_size: number;
  targetCountry?: string;
  templateId?: number;
  creatorId?: number;
  parentUserId?: number;
}

export interface BuyerChannelPage {
  list: BuyerChannelRow[];
  total: number;
}

export interface DomainBindingParams {
  domain: string;
  templateId: number;
  excludeChannelId?: number;
}

export interface DomainBindingResult {
  available: boolean;
  templateId?: number;
}

export interface ChannelDetectResult {
  success: boolean;
  summary: string;
  checkedAt: string;
}

export interface BuyerChannelRuntimeConfig {
  channelId: number;
  channelCode: string;
  runtimeVersion: string;
  templateId: number;
  templateVersion: string;
  templateAssets: Record<string, string>;
  templateParams: Record<string, string | boolean>;
  countryMode: CountryMode;
  allowedCountries: Array<{ code: string; dialCode: string }>;
  defaultDialCode: string;
  themeColor: string;
  platform: ChannelPlatform;
  pixelId?: string;
  eventMappings: {
    lead: string;
    loginRequest: string;
    loginSuccess: string;
  };
  appOpenEnabled: boolean;
  marketingEnabled: boolean;
}

export interface BuyerChannelMutationResult {
  channel: BuyerChannelDetail;
  runtimeVersion: string;
  published: boolean;
}

interface PromotionChannelVO {
  id: number;
  channelName: string;
  channelCode: string;
  ownerUserId: number;
  creatorUserId: number;
  targetCountry: string;
  targetCountryIso2?: string;
  targetCountryName?: string;
  targetCountryFlag?: string;
  mixedTargetCountry: boolean;
  landingTemplateId: number;
  templateName: string;
  platform: number;
  platformName: string;
  trackingStatus: string;
  promotionLink: string;
  splitLink: string;
  preselectedCountry: string;
  preselectedCountryIso2?: string;
  preselectedCountryName?: string;
  preselectedPhonePrefix?: string;
  preselectedCountryFlag?: string;
  status: number;
  inAppOpenAllowed: boolean;
  marketingAllowed: boolean;
  createdAt: number;
}

interface PromotionChannelPageResult {
  list: PromotionChannelVO[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface PromotionChannelDetailVO {
  id: number;
  channelName: string;
  ownerUserId: number;
  targetCountry: string;
  landingTemplateId: number;
  domain: string;
  preselectedCountry: string;
  platform: number;
  trackingId?: string;
  accessTokenConfigured: boolean;
  leadEventName?: string;
  loginRequestEventName?: string;
  loginSuccessEventName?: string;
  inAppOpenAllowed: boolean;
  marketingAllowed: boolean;
  status: number;
}

interface PromotionChannelCreatePayload {
  channelName: string;
  ownerUserId?: number;
  targetCountry: string;
  landingTemplateId: number;
  domain: string;
  preselectedCountry: string;
  platform: number;
  trackingId?: string;
  accessToken?: string;
  leadEventName?: string;
  loginRequestEventName?: string;
  loginSuccessEventName?: string;
  inAppOpenAllowed: boolean;
  marketingAllowed: boolean;
}

interface PromotionChannelUpdatePayload extends PromotionChannelCreatePayload {
  status: number;
}

const promotionPlatformCodes: Record<ChannelPlatform, number> = {
  FACEBOOK: 1,
  TIKTOK: 2,
  KUAISHOU: 3,
  MGSKY: 4
};

const channelPlatformsByCode: Record<number, ChannelPlatform> = {
  1: "FACEBOOK",
  2: "TIKTOK",
  3: "KUAISHOU",
  4: "MGSKY"
};

const previewCreatorNames: Record<number, string> = {
  1: "test",
  2: "testuser456",
  3: "Rahu",
  4: "ForeverAditya",
  5: "pingzi",
  6: "gose-"
};

function displayCountry(
  mixed: boolean,
  name?: string,
  fallback?: string
): string {
  if (mixed) return "混合（不限国家）";
  return name ?? fallback ?? "-";
}

function displayPreselectedCountry(value: PromotionChannelVO): string {
  return [value.preselectedCountryName, value.preselectedPhonePrefix]
    .filter(Boolean)
    .join(" ");
}

function formatCreatedAt(timestamp: number): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "-";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}`;
}

function trackingStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    NOT_APPLICABLE: "-",
    UNCONFIGURED: "-",
    UNPROBED: "未探测",
    PROBING: "探测中",
    NORMAL: "正常",
    ABNORMAL: "异常",
    UNKNOWN: "未知"
  };
  return labels[status] ?? status ?? "-";
}

function toBuyerChannelRow(value: PromotionChannelVO): BuyerChannelRow {
  return {
    id: value.id,
    name: value.channelName,
    channelCode: value.channelCode,
    targetCountry: displayCountry(
      value.mixedTargetCountry,
      value.targetCountryName,
      value.targetCountryIso2 ?? value.targetCountry
    ),
    targetCountryIso2: value.targetCountryIso2,
    mixedTargetCountry: value.mixedTargetCountry,
    templateId: value.landingTemplateId,
    templateName: value.templateName,
    platform: channelPlatformsByCode[value.platform] ?? "FACEBOOK",
    domainStatus: trackingStatusLabel(value.trackingStatus),
    promotionUrl: value.promotionLink,
    fissionUrl: value.splitLink,
    defaultDialCode:
      displayPreselectedCountry(value) || value.preselectedPhonePrefix || "-",
    preselectedCountryIso2: value.preselectedCountryIso2,
    status: value.status === 1 ? "ENABLED" : "DISABLED",
    creatorName:
      previewCreatorNames[value.creatorUserId] ?? String(value.creatorUserId),
    createdAt: formatCreatedAt(value.createdAt)
  };
}

function toBuyerChannelDetail(
  value: PromotionChannelDetailVO
): BuyerChannelDetail {
  const mixedTargetCountry = value.targetCountry === "MIXED";
  return {
    id: value.id,
    name: value.channelName,
    ownerId: value.ownerUserId,
    targetCountry: mixedTargetCountry ? "" : value.targetCountry,
    countryMode: mixedTargetCountry ? "MIXED" : "SPECIFIC",
    templateId: value.landingTemplateId,
    domain: value.domain,
    preselectedCountry: value.preselectedCountry,
    defaultDialCode: "",
    platform: channelPlatformsByCode[value.platform] ?? "FACEBOOK",
    pixelId: value.trackingId,
    accessTokenConfigured: value.accessTokenConfigured,
    eventLead: value.leadEventName,
    eventInitiateCheckout: value.loginRequestEventName,
    eventCompleteRegistration: value.loginSuccessEventName,
    openInApp: value.inAppOpenAllowed,
    joinMarketing: value.marketingAllowed,
    status: value.status === 1 ? "ENABLED" : "DISABLED"
  };
}

function toPromotionChannelCreatePayload(
  payload: BuyerChannelPayload
): PromotionChannelCreatePayload {
  const supportsCapi =
    payload.platform === "FACEBOOK" || payload.platform === "TIKTOK";
  return {
    channelName: payload.name,
    ownerUserId: payload.ownerId,
    targetCountry:
      payload.countryMode === "MIXED" ? "MIXED" : payload.targetCountry,
    landingTemplateId: payload.templateId,
    domain: payload.domain,
    preselectedCountry: payload.preselectedCountry,
    platform: promotionPlatformCodes[payload.platform],
    trackingId: payload.pixelId,
    accessToken: supportsCapi ? payload.accessToken : undefined,
    leadEventName: supportsCapi ? payload.eventLead : undefined,
    loginRequestEventName: supportsCapi
      ? payload.eventInitiateCheckout
      : undefined,
    loginSuccessEventName: supportsCapi
      ? payload.eventCompleteRegistration
      : undefined,
    inAppOpenAllowed: payload.openInApp,
    marketingAllowed: payload.joinMarketing
  };
}

function toPromotionChannelUpdatePayload(
  payload: BuyerChannelPayload
): PromotionChannelUpdatePayload {
  return {
    ...toPromotionChannelCreatePayload(payload),
    status: payload.status === "ENABLED" ? 1 : 0
  };
}

export function getBuyerChannelOptions(): Promise<BuyerChannelOptions> {
  return armadaRequest<BuyerChannelOptions>(
    "get",
    "/api/buyer/channels/options"
  );
}

export async function listBuyerChannels(
  params: BuyerChannelQuery
): Promise<BuyerChannelPage> {
  const result = await armadaRequest<PromotionChannelPageResult>(
    "get",
    "/api/promotion-channels/query",
    {
      params: {
        targetCountry: params.targetCountry,
        landingTemplateId: params.templateId,
        creatorUserId: params.creatorId,
        ownerUserIds: params.parentUserId,
        page: params.page,
        pageSize: params.page_size
      }
    }
  );
  return {
    list: result.list.map(toBuyerChannelRow),
    total: result.total
  };
}

export async function getBuyerChannel(id: number): Promise<BuyerChannelDetail> {
  const detail = await armadaRequest<PromotionChannelDetailVO>(
    "get",
    `/api/promotion-channels/detail/${id}`
  );
  return toBuyerChannelDetail(detail);
}

export function precheckBuyerChannelDomain(
  params: DomainBindingParams
): Promise<DomainBindingResult> {
  return armadaRequest<DomainBindingResult>(
    "get",
    "/api/buyer/channels/domain-binding",
    { params }
  );
}

export async function createBuyerChannel(
  payload: BuyerChannelPayload
): Promise<BuyerChannelMutationResult> {
  const channel = await armadaRequest<PromotionChannelVO>(
    "post",
    "/api/promotion-channels/create",
    { data: toPromotionChannelCreatePayload(payload) }
  );
  return {
    channel: {
      id: channel.id,
      name: channel.channelName,
      ownerId: channel.ownerUserId,
      targetCountry: channel.targetCountryIso2 ?? channel.targetCountry ?? "",
      countryMode: channel.mixedTargetCountry ? "MIXED" : "SPECIFIC",
      templateId: channel.landingTemplateId,
      themeColor: payload.themeColor,
      domain: payload.domain,
      preselectedCountry:
        channel.preselectedCountryIso2 ?? channel.preselectedCountry,
      defaultDialCode:
        channel.preselectedPhonePrefix ?? payload.defaultDialCode,
      platform: channelPlatformsByCode[channel.platform] ?? payload.platform,
      pixelId: payload.pixelId,
      accessTokenConfigured: Boolean(payload.accessToken),
      eventLead: payload.eventLead,
      eventInitiateCheckout: payload.eventInitiateCheckout,
      eventCompleteRegistration: payload.eventCompleteRegistration,
      openInApp: channel.inAppOpenAllowed,
      joinMarketing: channel.marketingAllowed,
      status: channel.status === 1 ? "ENABLED" : "DISABLED"
    },
    runtimeVersion: "",
    published: true
  };
}

export async function updateBuyerChannel(
  id: number,
  payload: BuyerChannelPayload
): Promise<{ published: boolean }> {
  await armadaRequest<void>("put", `/api/promotion-channels/update/${id}`, {
    data: toPromotionChannelUpdatePayload(payload)
  });
  return { published: true };
}

export function deleteBuyerChannel(id: number): Promise<void> {
  return armadaRequest<void>("delete", `/api/promotion-channels/delete/${id}`);
}

export function detectBuyerChannel(id: number): Promise<ChannelDetectResult> {
  return armadaRequest<ChannelDetectResult>(
    "post",
    `/api/buyer/channels/${id}/detect`
  );
}

export function getPublicBuyerChannelRuntime(
  host: string,
  channelCode: string
): Promise<BuyerChannelRuntimeConfig> {
  return armadaRequest<BuyerChannelRuntimeConfig>(
    "get",
    "/api/public/buyer/channel-runtime",
    {
      params: { host, channelCode }
    }
  );
}
