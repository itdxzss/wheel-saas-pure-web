import { armadaRequest } from "@/api/armada";
import { http } from "@/utils/http";
import { listHyperlinkStrategyOptionRows } from "@/api/hyperlink-strategy";

export type HyperlinkMessageType = 1 | 2 | 3 | 4;
export type HyperlinkTaskMode = "instant" | "rolling" | "cycle";
export type HyperlinkTaskStartMode = "now" | "scheduled";
export type HyperlinkEditorMode = "create" | "edit" | "view" | "copy";
export type HyperlinkProvisionStatus =
  | "NOT_REQUIRED"
  | "PROCESSING"
  | "READY"
  | "FAILED";

export interface HyperlinkButton {
  type: "CTA_URL";
  displayText: string;
  url: string;
  useShortLink: boolean;
}

export interface HyperlinkMessageContent {
  linkPreviewAssetId: number | null;
  title: string;
  linkDescription: string | null;
  promotionLink: string | null;
  bodyMainAssetId: number | null;
  content: string | null;
  cardText: string | null;
  buttons: HyperlinkButton[];
}

export interface HyperlinkAccountFilter {
  filterSchemaVersion: 1;
  countryIso2s: string[];
  excludeCountryIso2s: string[];
  continent: string | null;
  groupIds: number[];
  channelIds: number[];
  protocolId: string | null;
  onlineStatus: "ONLINE" | "OFFLINE" | null;
  rotationStatus: 0 | 1 | 2 | 3 | null;
  accountType: 1 | 2 | null;
  platform:
    | "ANDROID_PERSONAL"
    | "ANDROID_BUSINESS_PRIMARY"
    | "ANDROID_BUSINESS_COMPANION"
    | "IOS_PERSONAL"
    | "IOS_BUSINESS_PRIMARY"
    | "IOS_BUSINESS_COMPANION"
    | null;
  widType: "web5" | "native6" | null;
  importMode: "six_segment" | "full_param" | null;
  groupInviteAllowed: boolean | null;
  phone: string | null;
  importBatchId: number | null;
  source: 0 | 1 | 2 | 3 | 4 | null;
  friendCountMin: number | null;
  friendCountMax: number | null;
  /** 通讯录中有名字的联系人数下限；与双向好友是两个口径 */
  contactNamedNumMin: number | null;
  /** 通讯录中有名字的联系人数上限；与双向好友是两个口径 */
  contactNamedNumMax: number | null;
  retentionDaysMin: number | null;
  retentionDaysMax: number | null;
  registerDaysMin: number | null;
  registerDaysMax: number | null;
  createdAtFrom: number | null;
  createdAtTo: number | null;
}

export interface HyperlinkTaskSaveRequest {
  version: number | null;
  sourceTaskId: number | null;
  /** 新建任务时选中的模板策略；后端据此生成任务专属快照。 */
  sourceStrategyId: number | null;
  taskName: string;
  messageType: HyperlinkMessageType;
  messageContent: HyperlinkMessageContent;
  taskMode: HyperlinkTaskMode;
  plannedEndAt: number | null;
  cycleIntervalMinutes: number;
  accountFilter: HyperlinkAccountFilter;
  messageIntervalMinSeconds: number;
  messageIntervalMaxSeconds: number;
  maxExecutingAccounts: number;
  maxUseAccounts: number;
  maxSendPerAccount: number;
  startMode: HyperlinkTaskStartMode;
  delayMinutes: number;
  dataPackageId: number | null;
  enabled: boolean;
  quoteToken: string | null;
}

export interface HyperlinkTaskDetail
  extends Omit<
    HyperlinkTaskSaveRequest,
    "version" | "sourceTaskId" | "sourceStrategyId" | "quoteToken"
  > {
  id: number;
  version: number;
  editable: boolean;
  runStatus: 0 | 1 | 2 | 3 | 4;
  shortLinkEnabled: boolean;
  dataPackageName: string | null;
  dataPackageAvailable: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface HyperlinkTaskCreateContext {
  pricingMode: "NORMAL" | "SUPER";
  priceCode: string;
  currencyCode: string;
  referenceUnitPrice: number;
  accountBalance: number;
  giftBalance: number;
  availableBalance: number;
  protocolCount: number;
  maxConcurrentNum: number;
  accountSendConcurrency: 20;
  defaultSubTaskNum: 50;
  /** 系统业务组 public + hyperlink 的稳定 ID，由服务端按当前租户解析。 */
  defaultAccountGroupIds: number[];
  groupOptions: HyperlinkFilterOption[];
  countryOptions: HyperlinkFilterOption[];
  channelOptions: HyperlinkFilterOption[];
  /** 当前租户活跃账号中真实存在的协议标识候选。 */
  protocolOptions: HyperlinkFilterOption[];
}

export interface HyperlinkAccountMatchCount {
  availableAccountCount: number;
  protocolCount: number;
  maxConcurrentNum: number;
}

export interface HyperlinkTaskQuoteBreakdown {
  recipientCountryIso2: string | null;
  recipientCount: number;
  unitPrice: number;
  amount: number;
}

export interface HyperlinkTaskQuote {
  quoteToken: string;
  expiresAt: number;
  dataPackageId: number;
  dataPackageGeneration: number;
  dataPackageName: string;
  recipientCount: number;
  configuredMaxExecutingAccounts: number;
  effectiveMaxExecutingAccounts: number;
  pricingMode: "NORMAL" | "SUPER";
  priceCode: string;
  currencyCode: string;
  unitPrice: number | null;
  pricingBreakdown: HyperlinkTaskQuoteBreakdown[];
  estimatedAmount: number;
  accountBalance: number;
  giftBalance: number;
  availableBalance: number;
}

export interface HyperlinkTaskMutationReceipt {
  taskId: number;
  provisionStatus: HyperlinkProvisionStatus;
  enabled: boolean;
  runStatus: 0 | 1 | 2 | 3 | 4;
  version: number;
  pollAfterMs: number | null;
  failureCode: number | null;
  failureReason: string | null;
}

export interface HyperlinkStrategyOption {
  id: number;
  name: string;
  taskMode: HyperlinkTaskMode;
  accountFilter: HyperlinkAccountFilter;
  maxExecutingAccounts: number;
  maxUseAccounts: number;
  maxSendPerAccount: number;
  cycleIntervalMinutes: number;
}

export interface HyperlinkResourceAsset {
  id: number;
  name: string;
  tags: string[];
  contentType: string;
  sizeBytes: number;
  available: boolean;
}

export interface HyperlinkResourceAssetPage {
  list: HyperlinkResourceAsset[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface HyperlinkFilterOption {
  value: string | number;
  label: string;
  tags?: string[];
}

export interface HyperlinkFilterOptions {
  groups: HyperlinkFilterOption[];
  countries: HyperlinkFilterOption[];
  channels: HyperlinkFilterOption[];
  protocols: HyperlinkFilterOption[];
}

export type HyperlinkResourceUploadResult = HyperlinkResourceAsset;

export function getHyperlinkTaskCreateContext(): Promise<HyperlinkTaskCreateContext> {
  return armadaRequest("get", "/api/hyperlink-tasks/create-context");
}

export function getHyperlinkTask(id: number): Promise<HyperlinkTaskDetail> {
  return armadaRequest("get", `/api/hyperlink-tasks/${id}`);
}

export function countHyperlinkTaskAccounts(
  data: HyperlinkAccountFilter,
  signal?: AbortSignal
): Promise<HyperlinkAccountMatchCount> {
  return armadaRequest("post", "/api/hyperlink-tasks/account-match-count", {
    data,
    signal
  });
}

export function quoteHyperlinkTask(data: {
  purpose: "CREATE";
  taskId: null;
  dataPackageId: number;
  taskMode: HyperlinkTaskMode;
  maxExecutingAccounts: number;
  maxUseAccounts: number;
}): Promise<HyperlinkTaskQuote> {
  return armadaRequest("post", "/api/hyperlink-tasks/quote", { data });
}

export function createHyperlinkTask(
  data: HyperlinkTaskSaveRequest
): Promise<HyperlinkTaskMutationReceipt> {
  return armadaRequest("post", "/api/hyperlink-tasks", { data });
}

export function updateHyperlinkTask(
  id: number,
  data: HyperlinkTaskSaveRequest
): Promise<HyperlinkTaskMutationReceipt> {
  return armadaRequest("put", `/api/hyperlink-tasks/${id}`, { data });
}

export function getHyperlinkTaskProvisionStatus(
  id: number
): Promise<HyperlinkTaskMutationReceipt> {
  return armadaRequest("get", `/api/hyperlink-tasks/${id}/provision-status`);
}

export function listHyperlinkStrategyOptions(
  keyword?: string
): Promise<HyperlinkStrategyOption[]> {
  return listHyperlinkStrategyOptionRows(keyword);
}

export function listHyperlinkResourceAssets(query: {
  page?: number;
  pageSize?: number;
  keyword?: string;
}): Promise<HyperlinkResourceAssetPage> {
  return armadaRequest("get", "/api/resource-assets", {
    params: {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      keyword: query.keyword?.trim() || undefined,
      contentType: "image/jpeg"
    }
  });
}

export function uploadHyperlinkResourceAsset(
  file: File
): Promise<HyperlinkResourceUploadResult> {
  const data = new FormData();
  data.append("file", file);
  return armadaRequest(
    "post",
    "/api/resource-assets",
    { data },
    {
      beforeRequestCallback: config => {
        delete config.headers["Content-Type"];
      }
    }
  );
}

export function downloadHyperlinkResourceAsset(id: number): Promise<Blob> {
  return http.request<Blob>("get", `/api/resource-assets/${id}/content`, {
    responseType: "blob"
  });
}
