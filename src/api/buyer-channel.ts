import { armadaRequest } from "@/api/armada";

export type ChannelPlatform = "FACEBOOK" | "TIKTOK" | "KUAISHOU" | "MGSKY";
export type ChannelStatus = "ENABLED" | "DISABLED";
export type CountryMode = "MIXED" | "SPECIFIC";

export interface BuyerChannelOptions {
  countries: Array<{ code: string; name: string; dialCode: string }>;
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

export interface ChannelRuntime {
  channelCode: string;
  countries: string[];
  initialDialCode: string;
  template: { id: number; assetsUrl: string; runtimeVersion: string };
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
    params
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
): Promise<BuyerChannelDetail> {
  return armadaRequest<BuyerChannelDetail>("post", "/api/buyer/channels", {
    data: payload
  });
}

export function updateBuyerChannel(
  id: number,
  payload: BuyerChannelPayload
): Promise<BuyerChannelDetail> {
  return armadaRequest<BuyerChannelDetail>("put", `/api/buyer/channels/${id}`, {
    data: payload
  });
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
): Promise<ChannelRuntime> {
  return armadaRequest<ChannelRuntime>(
    "get",
    "/api/public/buyer/channel-runtime",
    {
      params: { host, channelCode }
    }
  );
}
