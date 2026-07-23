import { armadaRequest } from "@/api/armada";
import type { PageResponse } from "@/api/account";
import {
  normalizeMarketingTemplate,
  toMarketingTemplatePayload,
  type BackendMarketingTemplate,
  type MarketingTemplateRow,
  type MarketingTemplateWrite
} from "@/api/marketing-template";

export type MarketingTaskStatus = 1 | 2 | 5 | 7 | 8;
export type MarketingTaskTargetStatus = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type MarketingTaskStartMode = "PENDING" | "IMMEDIATE";
export type MarketingTargetScope = "GROUP_FIXED" | "ACCOUNT_DYNAMIC";
export type AccountGroupMembershipStatus =
  | "IN_GROUP"
  | "UNCONFIRMED"
  | "KICKED_OUT"
  | "LEFT"
  | "NOT_IN_GROUP";

export interface MarketingTaskRow {
  id: number;
  taskName: string;
  accountGroupId: number;
  accountGroupName: string;
  marketingTemplateId: number;
  marketingTemplateName: string;
  marketingTemplateContent?: string | null;
  marketingTemplateBodyText?: string | null;
  marketingTemplatePromotionLink?: string | null;
  status: MarketingTaskStatus;
  selectedAccountCount: number;
  targetGroupCount: number;
  targetPairCount: number;
  sentMessageCount: number;
  failedMessageCount: number;
  sendPerRound: number;
  accountGroupSendIntervalSeconds: number;
  sendIntervalSeconds: number;
  onlineCheckEnabled: boolean;
  abnormalGroupSkipped: boolean;
  autoRetryEnabled: boolean;
  retryLimit?: number | null;
  remark?: string | null;
  accountGroupSendAt?: number | null;
  taskStartAt?: number | null;
  taskEndAt?: number | null;
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
  targetScope?: MarketingTargetScope | null;
  groupLinkId?: number | null;
  groupJid?: string | null;
  groupLinkUrl?: string | null;
  groupName?: string | null;
  status: MarketingTaskTargetStatus;
  sentMessageCount: number;
  failedMessageCount: number;
  retryCount: number;
  lastAttemptAt?: number | null;
  lastSentAt?: number | null;
  lastReason?: string | null;
}

export type MarketingGroupExecutionResult = "SUCCESS" | "FAILED" | "SKIPPED";

export interface MarketingTaskGroupStatRow {
  groupLinkId?: number | null;
  groupJid?: string | null;
  groupLinkUrl?: string | null;
  groupName?: string | null;
  membershipStatus?: AccountGroupMembershipStatus | null;
  groupStatus?: MarketingGroupSendStatus | null;
  executionResult?: MarketingGroupExecutionResult | null;
  executionReason?: string | null;
  sentMessageCount: number;
  failedMessageCount: number;
  skippedMessageCount?: number | null;
  lastAttemptAt?: number | null;
  lastSentAt?: number | null;
  lastReason?: string | null;
}

export type MarketingGroupSendStatus =
  | "NORMAL"
  | "ACCOUNT_BANNED"
  | "GROUP_BANNED"
  | "NO_PERMISSION"
  | "KICKED_OUT"
  | "UNCONFIRMED";

export interface MarketingTaskAccountTargetRow {
  accountId: number;
  accountPhone: string;
  loginState?: number | null;
  status: MarketingTaskTargetStatus;
  sentMessageCount: number;
  failedMessageCount: number;
  skippedMessageCount?: number | null;
  lastAttemptAt?: number | null;
  lastSentAt?: number | null;
  lastReason?: string | null;
  groups: MarketingTaskGroupStatRow[];
}

export interface MarketingTaskDetail extends MarketingTaskRow {
  skippedMessageCount?: number | null;
  targets: MarketingTaskTargetRow[];
  accountTargets?: MarketingTaskAccountTargetRow[];
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
  membershipStatus?: AccountGroupMembershipStatus | null;
  membershipStatusText?: string | null;
  statusUpdatedAt?: number | null;
}

export interface MarketingTreeAccount {
  accountId: number;
  wsPhone: string;
  status:
    | "ONLINE"
    | "OFFLINE"
    | "RISK"
    | "BANNED"
    | "MUTED"
    | "UNAVAILABLE"
    | string;
  statusText?: string | null;
  groupCount?: number | null;
  selectable?: boolean | null;
  disabledReason?: string | null;
  groupsError: boolean;
  groups: MarketingTreeGroup[];
}

export interface MarketingAccountTree {
  accounts: MarketingTreeAccount[];
}

export interface MarketingSelection {
  accountId: number;
  targetScope: MarketingTargetScope;
  groupLinkIds: number[];
}

export interface CreateMarketingTaskRequest {
  taskName: string;
  accountGroupId: number;
  accountGroupName: string;
  marketingTemplateId: number;
  marketingTemplateName: string;
  startMode: MarketingTaskStartMode;
  accountGroupSendAt?: number | null;
  taskStartAt?: number | null;
  taskEndAt?: number | null;
  sendPerRound: number;
  accountGroupSendIntervalSeconds: number;
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

export function pauseMarketingTask(id: number): Promise<MarketingTaskRow> {
  return armadaRequest<MarketingTaskRow>(
    "post",
    `/api/marketing-tasks/${id}/pause`
  );
}

export function resumeMarketingTask(id: number): Promise<MarketingTaskRow> {
  return armadaRequest<MarketingTaskRow>(
    "post",
    `/api/marketing-tasks/${id}/resume`
  );
}

export function closeMarketingTask(id: number): Promise<MarketingTaskRow> {
  return armadaRequest<MarketingTaskRow>(
    "post",
    `/api/marketing-tasks/${id}/close`
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

export function fetchMarketingAccountGroups(
  accountId: number
): Promise<MarketingTreeAccount> {
  return armadaRequest<MarketingTreeAccount>(
    "get",
    `/api/marketing-tasks/account-tree/accounts/${accountId}/groups`
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
