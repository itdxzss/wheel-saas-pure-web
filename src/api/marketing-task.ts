import { armadaRequest } from "@/api/armada";
import type { PageResponse } from "@/api/account";
import {
  normalizeMarketingTemplate,
  toMarketingTemplatePayload,
  type BackendMarketingTemplate,
  type MarketingTemplateRow,
  type MarketingTemplateWrite
} from "@/api/marketing-template";

export type MarketingTaskStatus = 1 | 2 | 3 | 4 | 5 | 6;
export type MarketingTaskTargetStatus = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type MarketingTaskStartMode = "PENDING" | "IMMEDIATE";

export interface MarketingTaskRow {
  id: number;
  taskName: string;
  accountGroupId: number;
  accountGroupName: string;
  marketingTemplateId: number;
  marketingTemplateName: string;
  status: MarketingTaskStatus;
  selectedAccountCount: number;
  targetGroupCount: number;
  targetPairCount: number;
  sentMessageCount: number;
  failedMessageCount: number;
  sendPerRound: number;
  sendIntervalSeconds: number;
  onlineCheckEnabled: boolean;
  abnormalGroupSkipped: boolean;
  autoRetryEnabled: boolean;
  retryLimit?: number | null;
  remark?: string | null;
  startedAt?: number | null;
  lastSentAt?: number | null;
  finishedAt?: number | null;
  createdAt?: number | null;
  updatedAt?: number | null;
}

export interface MarketingTaskTargetRow {
  id: number;
  accountId: number;
  accountPhone: string;
  groupLinkId: number;
  groupJid: string;
  groupLinkUrl: string;
  groupName?: string | null;
  status: MarketingTaskTargetStatus;
  sentMessageCount: number;
  failedMessageCount: number;
  retryCount: number;
  lastAttemptAt?: number | null;
  lastSentAt?: number | null;
  lastReason?: string | null;
}

export interface MarketingTaskDetail extends MarketingTaskRow {
  targets: MarketingTaskTargetRow[];
}

export interface MarketingTaskQuery {
  page?: number;
  pageSize?: number;
  id?: number;
  keyword?: string;
  status?: MarketingTaskStatus | "";
  startTime?: number;
  endTime?: number;
}

export interface MarketingTreeGroup {
  groupLinkId: number;
  groupJid: string;
  groupName?: string | null;
  linkUrl: string;
  isAdmin?: boolean | null;
}

export interface MarketingTreeAccount {
  accountId: number;
  wsPhone: string;
  status: "ONLINE" | "OFFLINE" | "RISK" | "BANNED" | "MUTED" | string;
  groupsError: boolean;
  groups: MarketingTreeGroup[];
}

export interface MarketingAccountTree {
  accounts: MarketingTreeAccount[];
}

export interface MarketingSelection {
  accountId: number;
  groupLinkIds: number[];
}

export interface CreateMarketingTaskRequest {
  taskName: string;
  accountGroupId: number;
  accountGroupName: string;
  marketingTemplateId: number;
  marketingTemplateName: string;
  startMode: MarketingTaskStartMode;
  sendPerRound: number;
  sendIntervalSeconds: number;
  onlineCheckEnabled: boolean;
  abnormalGroupSkipped: boolean;
  autoRetryEnabled: boolean;
  remark?: string | null;
  selections: MarketingSelection[];
}

function toListParams(query: MarketingTaskQuery) {
  return {
    page: query.page,
    pageSize: query.pageSize,
    id: query.id,
    keyword: query.keyword,
    status: query.status || undefined,
    startTime: query.startTime,
    endTime: query.endTime
  };
}

export function listMarketingTasks(
  query: MarketingTaskQuery = {}
): Promise<PageResponse<MarketingTaskRow>> {
  return armadaRequest<PageResponse<MarketingTaskRow>>(
    "get",
    "/api/marketing-tasks",
    { params: toListParams(query) }
  );
}

export function createMarketingTask(
  data: CreateMarketingTaskRequest
): Promise<MarketingTaskRow> {
  return armadaRequest<MarketingTaskRow>("post", "/api/marketing-tasks", {
    data
  });
}

export function getMarketingTaskDetail(
  id: number
): Promise<MarketingTaskDetail> {
  return armadaRequest<MarketingTaskDetail>(
    "get",
    `/api/marketing-tasks/${id}`
  );
}

export function startMarketingTask(id: number): Promise<MarketingTaskRow> {
  return armadaRequest<MarketingTaskRow>(
    "post",
    `/api/marketing-tasks/${id}/start`
  );
}

export function stopMarketingTask(id: number): Promise<MarketingTaskRow> {
  return armadaRequest<MarketingTaskRow>(
    "post",
    `/api/marketing-tasks/${id}/stop`
  );
}

export function batchDeleteMarketingTasks(ids: number[]): Promise<number> {
  return armadaRequest<number>("post", "/api/marketing-tasks/batch-delete", {
    data: { ids }
  });
}

export function fetchMarketingAccountTree(
  groupId: number
): Promise<MarketingAccountTree> {
  return armadaRequest<MarketingAccountTree>(
    "get",
    "/api/marketing-tasks/account-tree",
    { params: { groupId } }
  );
}

export function updateTaskMarketingTemplate(
  id: number,
  data: MarketingTemplateWrite
): Promise<MarketingTemplateRow> {
  return armadaRequest<BackendMarketingTemplate>(
    "put",
    `/api/marketing-tasks/${id}/marketing-template`,
    { data: toMarketingTemplatePayload(data) }
  ).then(normalizeMarketingTemplate);
}
