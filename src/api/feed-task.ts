import { armadaRequest } from "@/api/armada";
import type { PureHttpRequestConfig } from "@/utils/http/types.d";
import {
  listTenantAccounts,
  type PageResponse,
  type TenantAccountListQuery
} from "@/api/account";

export type FeedTaskStatus = 0 | 1 | 2 | 3 | 4;
export type FeedTaskAction = "start" | "pause" | "resume" | "stop";
export type FeedTaskMode = "instant" | "rolling";
export type FeedTaskStartMode = "now" | "scheduled";

export interface FeedTaskAccountFilter {
  keyword?: string;
  phone?: string;
  accountType?: 1 | 2 | "";
  protocolId?: string;
  numberSource?: 1 | 2 | 3 | "";
  channelName?: string;
  accountState?: number | "";
  loginState?: 1 | 2 | 3 | "";
  riskStatus?: 1 | 2 | 3 | "";
  muteStatus?: 1 | 2 | "6h" | "24h" | "";
  accountGroupId?: number | "";
  country?: string;
  truthIp?: string;
  callable?: boolean | "";
  countryIso2s?: string[];
  excludeCountryIso2s?: string[];
  continent?: string;
  onlineStatus?: "online" | "offline" | "";
  groupIds?: number[];
  channelIds?: number[];
  createdAtFrom?: string;
  createdAtTo?: string;
  friendCountMin?: number | null;
  friendCountMax?: number | null;
  retentionDaysMin?: number | null;
  retentionDaysMax?: number | null;
  registerDaysMin?: number | null;
  registerDaysMax?: number | null;
  widType?: "web5" | "native6" | "";
  source?: 0 | 1 | 2 | 3 | 4 | "";
  groupInviteAllowed?: boolean | "";
}

export interface FeedTaskRow {
  id: number;
  name: string;
  accountFilter: FeedTaskAccountFilter;
  title: string;
  description?: string | null;
  content: string;
  promotionLink: string;
  linkPreviewImage?: string | null;
  textColor: string;
  backgroundColor: string;
  concurrency: number;
  retryMax: number;
  startMode: FeedTaskStartMode;
  taskMode: FeedTaskMode;
  taskStatus: FeedTaskStatus;
  status: 0 | 1;
  taskDelayMinutes?: number | null;
  totalAccountNum: number;
  successAccountNum: number;
  failedAccountNum: number;
  taskStartAt?: string | null;
  taskPlannedEndAt?: string | null;
  createdAt?: string | null;
}

export type FeedTaskDetail = FeedTaskRow;

export interface FeedTaskQuery {
  page?: number;
  pageSize?: number;
  name?: string;
  taskStatus?: FeedTaskStatus | "";
  createdAtStart?: string;
  createdAtEnd?: string;
}

export interface FeedTaskWrite {
  name: string;
  accountFilter: FeedTaskAccountFilter;
  title: string;
  description: string;
  content: string;
  promotionLink: string;
  textColor: string;
  backgroundColor: string;
  taskDelayMinutes: number;
  status: 0 | 1;
  concurrency: number;
  retryMax: number;
  taskMode: FeedTaskMode;
  taskPlannedEndAt?: string | null;
}

export interface FeedTaskAccountRow {
  id: number;
  accountId: number;
  accountPhone: string;
  sendStatus: string;
  retryNum: number;
  retryMax: number;
  sendAt?: string | null;
  successAt?: string | null;
  failedAt?: string | null;
  failCode?: string | null;
  failReason?: string | null;
}

export interface FeedTaskAccountDataQuery {
  page?: number;
  pageSize?: number;
  accountPhone?: string;
}

function compactFilter(filter: FeedTaskAccountFilter): FeedTaskAccountFilter {
  return Object.fromEntries(
    Object.entries(filter).filter(([, value]) => {
      if (value === "" || value == null) return false;
      return !Array.isArray(value) || value.length > 0;
    })
  ) as FeedTaskAccountFilter;
}

function toFormData(data: FeedTaskWrite, image: File | null): FormData {
  const formData = new FormData();
  const payload = {
    ...data,
    accountFilter: JSON.stringify(compactFilter(data.accountFilter))
  };
  Object.entries(payload).forEach(([key, value]) => {
    if (value != null) formData.append(key, String(value));
  });
  if (image) formData.append("linkPreviewImage", image);
  return formData;
}

function multipartConfig(): PureHttpRequestConfig {
  return {
    beforeRequestCallback: config => {
      delete config.headers["Content-Type"];
    }
  };
}

export function listFeedTasks(
  query: FeedTaskQuery = {}
): Promise<PageResponse<FeedTaskRow>> {
  return armadaRequest<PageResponse<FeedTaskRow>>("get", "/api/feed-tasks", {
    params: {
      page: query.page,
      pageSize: query.pageSize,
      name: query.name?.trim() || undefined,
      taskStatus: query.taskStatus || undefined,
      createdAtStart: query.createdAtStart,
      createdAtEnd: query.createdAtEnd
    }
  });
}

export function getFeedTask(id: number): Promise<FeedTaskDetail> {
  return armadaRequest<FeedTaskDetail>("get", `/api/feed-tasks/${id}`);
}

export function createFeedTask(
  data: FeedTaskWrite,
  image: File | null
): Promise<FeedTaskRow> {
  return armadaRequest<FeedTaskRow>(
    "post",
    "/api/feed-tasks",
    { data: toFormData(data, image) },
    multipartConfig()
  );
}

export function updateFeedTask(
  id: number,
  data: FeedTaskWrite,
  image: File | null
): Promise<FeedTaskRow> {
  return armadaRequest<FeedTaskRow>(
    "put",
    `/api/feed-tasks/${id}`,
    { data: toFormData(data, image) },
    multipartConfig()
  );
}

export function actionFeedTask(
  id: number,
  action: FeedTaskAction
): Promise<FeedTaskRow> {
  return armadaRequest<FeedTaskRow>(
    "post",
    `/api/feed-tasks/${id}/action`,
    { data: { action } }
  );
}

export function listFeedTaskAccounts(
  id: number,
  query: FeedTaskAccountDataQuery = {}
): Promise<PageResponse<FeedTaskAccountRow>> {
  return armadaRequest<PageResponse<FeedTaskAccountRow>>(
    "get",
    `/api/feed-tasks/${id}/data`,
    { params: query }
  );
}

function toAccountCountQuery(
  filter: FeedTaskAccountFilter
): TenantAccountListQuery {
  return {
    page: 1,
    page_size: 1,
    keyword: filter.keyword,
    phone: filter.phone,
    account_type: filter.accountType,
    protocol_id: filter.protocolId,
    number_source: filter.numberSource,
    channel_name: filter.channelName,
    account_state: filter.accountState || 2,
    login_state: filter.loginState,
    risk_status: filter.riskStatus,
    mute_status: filter.muteStatus,
    accountGroupId: filter.accountGroupId,
    country: filter.country,
    truthIp: filter.truthIp,
    callable: filter.callable
  };
}

export async function countFeedTaskAccounts(
  filter: FeedTaskAccountFilter
): Promise<number> {
  const result = await listTenantAccounts(toAccountCountQuery(filter));
  return result.total ?? 0;
}
