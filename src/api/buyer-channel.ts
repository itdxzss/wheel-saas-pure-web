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
  templateId: number;
  templateName: string;
  platform: ChannelPlatform;
  domainStatus: string;
  promotionUrl: string;
  fissionUrl: string;
  defaultDialCode: string;
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

export function getBuyerChannelOptions(): Promise<BuyerChannelOptions> {
  return armadaRequest<BuyerChannelOptions>(
    "get",
    "/api/buyer/channels/options"
  );
}

export function listBuyerChannels(
  params: BuyerChannelQuery
): Promise<BuyerChannelPage> {
  return armadaRequest<BuyerChannelPage>("get", "/api/buyer/channels", {
    params: {
      countryCode: params.targetCountry,
      templateId: params.templateId,
      createdBy: params.creatorId,
      parentUserId: params.parentUserId,
      page: params.page,
      pageSize: params.page_size
    }
  });
}

export function getBuyerChannel(id: number): Promise<BuyerChannelDetail> {
  return armadaRequest<BuyerChannelDetail>("get", `/api/buyer/channels/${id}`);
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

export function createBuyerChannel(
  payload: BuyerChannelPayload
): Promise<BuyerChannelMutationResult> {
  return armadaRequest<BuyerChannelMutationResult>(
    "post",
    "/api/buyer/channels",
    { data: payload }
  );
}

export function updateBuyerChannel(
  id: number,
  payload: BuyerChannelPayload
): Promise<BuyerChannelMutationResult> {
  return armadaRequest<BuyerChannelMutationResult>(
    "put",
    `/api/buyer/channels/${id}`,
    { data: payload }
  );
}

export function deleteBuyerChannel(id: number): Promise<void> {
  return armadaRequest<void>("delete", `/api/buyer/channels/${id}`);
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
