import { armadaRequest } from "@/api/armada";
import type { PageResponse } from "@/api/account";

export type JoinTaskStatus =
  | "DRAFT"
  | "RUNNING"
  | "PAUSED"
  | "STOPPED"
  | "DONE"
  | "FAILED"
  | (string & {});

export type JoinTaskDistributionMode =
  | "FIXED_ACCOUNTS_PER_LINK"
  | "FIXED_ACCOUNT_MULTI_LINK"
  | (string & {});

export type JoinResultStatus = "PENDING" | "SUCCESS" | "FAILED" | (string & {});

export interface SelectedJoinAccount {
  accountId: number;
  phone: string;
}

export interface JoinTaskRow {
  id: number;
  name: string;
  accountGroupNames?: string | null;
  total: number;
  executed: number;
  success: number;
  failed: number;
  pending: number;
  intervalLabel?: string | null;
  distributionMode: JoinTaskDistributionMode;
  failurePolicy?: string | null;
  retryEnabled: boolean;
  retryLimit: number;
  status: JoinTaskStatus;
  createdBy?: number | null;
  createdAt?: number | null;
}

export interface JoinTaskDetail extends JoinTaskRow {
  accountGroupIds: number[];
  selectedAccountIds: number[];
  linksText?: string | null;
  accountsPerLink: number;
  executorAccountCount: number;
  linksPerAccount: number;
  fixedIntervalMinSec: number;
  fixedIntervalMaxSec: number;
  multiIntervalMinSec: number;
  multiIntervalMaxSec: number;
  updatedAt?: number | null;
}

export interface JoinResultRow {
  account?: string | null;
  link?: string | null;
  status: JoinResultStatus;
  reason?: string | null;
  isAdmin: boolean;
}

export interface JoinTaskQuery {
  page?: number;
  pageSize?: number;
  page_size?: number;
  keyword?: string;
  status?: JoinTaskStatus | "";
  groupId?: number | "";
  distributionMode?: JoinTaskDistributionMode | "";
  interval?: string;
  dateFrom?: number | string;
  dateTo?: number | string;
}

export interface CreateJoinTaskRequest {
  name: string;
  accountGroupIds: number[];
  accountGroupNames: string[];
  selectedAccounts: SelectedJoinAccount[];
  linksText: string;
  distributionMode: JoinTaskDistributionMode;
  accountsPerLink: number;
  executorAccountCount: number;
  linksPerAccount: number;
  fixedIntervalMinSec: number;
  fixedIntervalMaxSec: number;
  multiIntervalMinSec: number;
  multiIntervalMaxSec: number;
  retryEnabled: boolean;
  retryLimit: number;
  failurePolicy: string;
}

export interface JoinTaskBatchDeleteResponse {
  deleted_count: number;
}

function optionalString(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function toNumber(value?: number | string): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function toQuery(params: JoinTaskQuery) {
  return {
    page: params.page,
    pageSize: params.pageSize ?? params.page_size,
    keyword: optionalString(params.keyword),
    status: optionalString(params.status),
    groupId: params.groupId || undefined,
    distributionMode: optionalString(params.distributionMode),
    interval: optionalString(params.interval),
    dateFrom: toNumber(params.dateFrom),
    dateTo: toNumber(params.dateTo)
  };
}

export function listJoinTasks(
  params: JoinTaskQuery = {}
): Promise<PageResponse<JoinTaskRow>> {
  return armadaRequest<PageResponse<JoinTaskRow>>("get", "/api/join-tasks", {
    params: toQuery(params)
  });
}

export function listJoinTaskIntervals(): Promise<string[]> {
  return armadaRequest<string[]>("get", "/api/join-tasks/intervals");
}

export function createJoinTask(
  data: CreateJoinTaskRequest
): Promise<JoinTaskRow> {
  return armadaRequest<JoinTaskRow>("post", "/api/join-tasks", { data });
}

export function getJoinTaskDetail(id: number): Promise<JoinTaskDetail> {
  return armadaRequest<JoinTaskDetail>("get", `/api/join-tasks/${id}`);
}

export function updateJoinTask(
  id: number,
  data: CreateJoinTaskRequest
): Promise<JoinTaskDetail> {
  return armadaRequest<JoinTaskDetail>("put", `/api/join-tasks/${id}`, {
    data
  });
}

export function getJoinTaskResults(id: number): Promise<JoinResultRow[]> {
  return armadaRequest<JoinResultRow[]>("get", `/api/join-tasks/${id}/results`);
}

export function batchDeleteJoinTasks(
  ids: number[]
): Promise<JoinTaskBatchDeleteResponse> {
  return armadaRequest<number>("post", "/api/join-tasks/batch-delete", {
    data: { ids }
  }).then(count => ({ deleted_count: count ?? 0 }));
}
