import { armadaRequest } from "@/api/armada";
import type { PageResponse } from "@/api/account";

export type PullTaskStatus =
  | "WAIT_START"
  | "EXECUTING"
  | "PAUSED"
  | "INTERRUPTED"
  | "COMPLETED"
  | "ENDED";

export type PullTaskMode = "OLD_LINK" | "CREATE_NEW" | string;

export type PullTaskGroupStatus =
  | "WAIT_START"
  | "INITIALIZING"
  | "RUNNING"
  | "GROUP_CREATE_FAILED"
  | "GROUP_BANNED"
  | "PULLER_SHORTAGE"
  | "PAUSED"
  | "COMPLETED"
  | "ENDED"
  | "ADMIN_SETUP_FAILED"
  | "GROUP_INVALID"
  | string;

export interface PullTaskRow {
  id: number;
  taskName: string;
  groupName?: string | null;
  mode: PullTaskMode;
  status: PullTaskStatus;
  groupCount: number;
  totalMembers?: number | null;
  expectedPullCount: number;
  joinedCount: number;
  failedCount: number;
  bannedCount: number;
  unusedCount: number;
  pullerCount: number;
  operator?: string | null;
  submitted?: boolean | null;
  createdAt?: number | null;
  updatedAt?: number | null;
  remark?: string | null;
}

export interface PullTaskGroupRow {
  id: number;
  seq: number;
  groupName?: string | null;
  groupLinkUrl?: string | null;
  status: PullTaskGroupStatus;
  memberCount?: number | null;
  joinedCount: number;
  failedCount: number;
  unusedCount: number;
  expectedPullCount?: number | null;
  submitted?: boolean | null;
  blockReason?: string | null;
  adminPhones?: string[] | null;
  pullerPhones?: string[] | null;
  createdAt?: number | null;
  updatedAt?: number | null;
}

export interface PullTaskSummary {
  status: PullTaskStatus;
  mode: PullTaskMode;
  groupCount: number;
  totalMembers: number;
  abnormalCount: number;
  joinedCount: number;
  unusedCount: number;
  expectedPullCount: number;
}

export interface PullTaskDetail extends PullTaskRow {
  summary?: PullTaskSummary | null;
  config?: Record<string, unknown> | null;
}

export interface PullTaskLinkGroup {
  id: number;
  name: string;
  totalLinks?: number | null;
}

export interface PullTaskLinkOption {
  id: number;
  groupName?: string | null;
  linkUrl: string;
  url?: string | null;
  statusLabel?: string | null;
  memberCount?: number | null;
}

interface BackendPullTaskLinkOption extends PullTaskLinkOption {
  url?: string | null;
  groupName?: string | null;
  waSubject?: string | null;
}

export interface PullTaskQuery {
  page?: number;
  pageSize?: number;
  id?: number;
  keyword?: string;
  status?: PullTaskStatus | "";
  mode?: PullTaskMode | "";
  orderState?: "SUBMITTED" | "UNSUBMITTED" | "";
  banState?: "NORMAL" | "BANNED" | "";
  operator?: string;
}

export interface PullTaskGroupQuery {
  page?: number;
  pageSize?: number;
  status?: PullTaskGroupStatus | "";
  keyword?: string;
}

export interface CreatePullTaskRequest {
  taskName: string;
  subMode: "OLD_LINK" | "CREATE_NEW";
  useAdmin: boolean;
  wsLinkGroupId?: number | null;
  groupLinkIds: number[];
  pastedLinks: string[];
  templateId?: number | null;
  adminGroupId?: number | null;
  pullerGroupId?: number | null;
  stationOneGroupId?: number | null;
  stationTwoGroupId?: number | null;
  stationThreeGroupId?: number | null;
  adminPerGroup: number;
  pullerPerGroup: number;
  stationOnePerGroup: number;
  stationTwoPerGroup: number;
  stationThreePerGroup: number;
  autoSupplementAdminCount: number;
  autoSupplementAdminTimes: number;
  autoSupplementPullerCount: number;
  autoSupplementPullerTimes: number;
  pullerFinishGroupId?: number | null;
  adminFinishGroupId?: number | null;
  autoStart: boolean;
  pullerEnterFirst: boolean;
  auditMode: string;
  noReleaseAfterPull: boolean;
  pullerSyncMode: string;
  waitBeforePullSeconds: number;
  concurrentTaskCount: number;
  firstPullCount: number;
  pullCountMin: number;
  pullCountMax: number;
  pullIntervalSeconds: number;
  pullerMaxTotal: number;
  pullerThreadCount: number;
  stationJoinMode: string;
  pullerJoinMode: string;
  pullerQuitMode: string;
  adminQuitMode: string;
  stationQuitAfterDone: boolean;
  materialText: string;
  waterText?: string | null;
  waterMode?: string | null;
  groupProfile: {
    groupName?: string | null;
    mute?: boolean;
    linkPermission?: string | null;
    editPermission?: string | null;
    autoCloseInvite?: boolean;
  };
  remark?: string | null;
}

export interface PullTaskIdsRequest {
  ids: number[];
}

export interface PullTaskSupplementRequest {
  groupRowIds: number[];
  accountGroupId: number;
  countPerGroup: number;
  joinMode: string;
}

export interface PullTaskGroupOperationRequest {
  groupRowIds: number[];
  operation: string;
}

export interface PullTaskExportResult {
  filename: string;
  content: string;
}

function toListParams(query: PullTaskQuery) {
  return {
    page: query.page,
    pageSize: query.pageSize,
    id: query.id,
    keyword: query.keyword,
    status: query.status || undefined,
    mode: query.mode || undefined,
    orderState: query.orderState || undefined,
    banState: query.banState || undefined,
    operator: query.operator || undefined
  };
}

export function listPullTasks(
  query: PullTaskQuery = {}
): Promise<PageResponse<PullTaskRow>> {
  return armadaRequest<PageResponse<PullTaskRow>>("get", "/api/pull-tasks", {
    params: toListParams(query)
  });
}

export function createPullTask(
  data: CreatePullTaskRequest
): Promise<PullTaskRow> {
  return armadaRequest<PullTaskRow>("post", "/api/pull-tasks", { data });
}

export function getPullTaskDetail(id: number): Promise<PullTaskDetail> {
  return armadaRequest<PullTaskDetail>("get", `/api/pull-tasks/${id}`);
}

export function listPullTaskGroups(
  id: number,
  query: PullTaskGroupQuery = {}
): Promise<PageResponse<PullTaskGroupRow>> {
  return armadaRequest<PageResponse<PullTaskGroupRow>>(
    "get",
    `/api/pull-tasks/${id}/groups`,
    {
      params: {
        page: query.page,
        pageSize: query.pageSize,
        status: query.status || undefined,
        keyword: query.keyword || undefined
      }
    }
  );
}

export function startPullTask(id: number): Promise<PullTaskRow> {
  return armadaRequest<PullTaskRow>("post", `/api/pull-tasks/${id}/start`);
}

export function pausePullTask(id: number): Promise<PullTaskRow> {
  return armadaRequest<PullTaskRow>("post", `/api/pull-tasks/${id}/pause`);
}

export function stopPullTask(id: number): Promise<PullTaskRow> {
  return armadaRequest<PullTaskRow>("post", `/api/pull-tasks/${id}/stop`);
}

export function batchDeletePullTasks(ids: number[]): Promise<number> {
  return armadaRequest<number>("post", "/api/pull-tasks/batch-delete", {
    data: { ids }
  });
}

export function listPullTaskLinkGroups(): Promise<PullTaskLinkGroup[]> {
  return armadaRequest<PullTaskLinkGroup[]>("get", "/api/group-link-labels");
}

export function listPullTaskGroupLinks(
  params: { page?: number; pageSize?: number; labelId?: number | null } = {}
): Promise<PageResponse<PullTaskLinkOption>> {
  return armadaRequest<PageResponse<BackendPullTaskLinkOption>>(
    "get",
    "/api/group-links",
    {
      params: {
        page: params.page,
        pageSize: params.pageSize,
        labelId: params.labelId || undefined
      }
    }
  ).then(result => ({
    ...result,
    list:
      result.list?.map(row => ({
        ...row,
        groupName: row.groupName ?? row.waSubject ?? null,
        linkUrl: row.linkUrl ?? row.url ?? ""
      })) ?? []
  }));
}

export function supplementPullTaskRows(
  id: number,
  data: PullTaskSupplementRequest
): Promise<number> {
  return armadaRequest<number>(
    "post",
    `/api/pull-tasks/${id}/groups/supplement-pullers`,
    { data }
  );
}

export function runPullTaskGroupOperation(
  id: number,
  data: PullTaskGroupOperationRequest
): Promise<number> {
  return armadaRequest<number>(
    "post",
    `/api/pull-tasks/${id}/groups/operations`,
    { data }
  );
}

export function runPullTaskRowsOperation(
  id: number,
  data: PullTaskGroupOperationRequest
): Promise<number> {
  return armadaRequest<number>(
    "post",
    `/api/pull-tasks/${id}/groups/task-operations`,
    { data }
  );
}

export function exportPullTaskReport(
  id: number,
  groupRowIds: number[] = []
): Promise<PullTaskExportResult> {
  return armadaRequest<PullTaskExportResult>(
    "get",
    `/api/pull-tasks/${id}/export-report`,
    { params: { groupRowIds: groupRowIds.join(",") || undefined } }
  );
}

export function exportPullTaskGroupLinks(
  id: number,
  groupRowIds: number[] = []
): Promise<PullTaskExportResult> {
  return armadaRequest<PullTaskExportResult>(
    "get",
    `/api/pull-tasks/${id}/export-links`,
    { params: { groupRowIds: groupRowIds.join(",") || undefined } }
  );
}

export function exportPullTaskResources(
  id: number,
  kind: string,
  groupRowIds: number[] = []
): Promise<PullTaskExportResult> {
  return armadaRequest<PullTaskExportResult>(
    "get",
    `/api/pull-tasks/${id}/export-resources`,
    {
      params: {
        kind,
        groupRowIds: groupRowIds.join(",") || undefined
      }
    }
  );
}
