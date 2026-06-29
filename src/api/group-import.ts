import { armadaRequest } from "@/api/armada";
import type { PageResponse } from "@/api/account";
import { http } from "@/utils/http";
import { formatEpochMillis } from "@/utils/time";

export interface GroupImportGroup {
  id: number;
  linkLabelName: string;
  region?: string | null;
  remark?: string | null;
  linkCount: number;
  sourceFile?: string | null;
  fileCount: number;
  totalRows: number;
  successRows: number;
  failedRows: number;
  importedAt: string;
  status: string;
}

export interface GroupImportDetail {
  lineNo: number;
  groupName?: string | null;
  rawUrl?: string | null;
  sourceFileName?: string | null;
  result?: number | null;
  resultLabel?: string | null;
  successType?: number | null;
  successTypeLabel?: string | null;
  failReason?: string | null;
  existingOrigin?: number | null;
  existingOriginLabel?: string | null;
  createdAt?: number | null;
}

export interface GroupLinkForMigration {
  id: number;
  url?: string | null;
  groupName?: string | null;
  waSubject?: string | null;
  sourceFileName?: string | null;
  status?: string | null;
  statusLabel?: string | null;
  memberCount?: number | null;
  origin?: number | null;
  source?: string | null;
  createdAt?: number | null;
}

export interface GroupLinkLabel {
  id: number;
  name: string;
  region?: string | null;
  remark?: string | null;
}

export interface GroupLinkLabelWrite {
  name: string;
  region?: string | null;
  remark?: string | null;
}

export interface GroupImportGroupQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  id?: number;
  importedFrom?: number;
  importedTo?: number;
  status?: string;
}

export interface GroupImportDetailQuery {
  labelId?: number;
  batchId?: number;
  page?: number;
  pageSize?: number;
}

export interface GroupLinkMigrationQuery {
  labelId: number;
  page?: number;
  pageSize?: number;
  keyword?: string;
}

export interface GroupLinkMigrateInput {
  linkIds: number[];
  targetLabelId: number;
}

export interface CreateGroupLinkImportBatchInput {
  labelId: number;
  batchName?: string | null;
  text?: string | null;
  file?: File | null;
}

interface ArmadaGroupLinkLabel {
  id: number;
  name: string;
  region?: string | null;
  remark?: string | null;
  linkCount?: number | null;
  fileCount?: number | null;
  totalRows?: number | null;
  successRows?: number | null;
  failedRows?: number | null;
  latestSourceFile?: string | null;
  latestImportedAt?: number | null;
  status?: string | null;
  createdAt?: number | null;
}

function toGroupImportGroup(row: ArmadaGroupLinkLabel): GroupImportGroup {
  return {
    id: row.id,
    linkLabelName: row.name,
    region: row.region,
    remark: row.remark,
    linkCount: row.linkCount ?? 0,
    sourceFile: row.latestSourceFile ?? null,
    fileCount: row.fileCount ?? 0,
    totalRows: row.totalRows ?? 0,
    successRows: row.successRows ?? 0,
    failedRows: row.failedRows ?? 0,
    importedAt: formatEpochMillis(row.latestImportedAt ?? row.createdAt),
    status: row.status || "EMPTY"
  };
}

function toFormData(data: CreateGroupLinkImportBatchInput): FormData {
  const form = new FormData();
  form.append("labelId", String(data.labelId));
  if (data.batchName) form.append("batchName", data.batchName);
  if (data.text) form.append("text", data.text);
  if (data.file) form.append("file", data.file);
  return form;
}

export function listGroupImportGroups(
  query: GroupImportGroupQuery = {}
): Promise<PageResponse<GroupImportGroup>> {
  return armadaRequest<PageResponse<ArmadaGroupLinkLabel>>(
    "get",
    "/api/group-link-labels",
    {
      params: {
        page: query.page,
        pageSize: query.pageSize,
        keyword: query.keyword,
        id: query.id,
        importedFrom: query.importedFrom,
        importedTo: query.importedTo,
        status: query.status
      }
    }
  ).then(result => ({
    ...result,
    list: result.list?.map(toGroupImportGroup) ?? []
  }));
}

export function listGroupLinkLabels(
  keyword?: string
): Promise<PageResponse<GroupLinkLabel>> {
  return armadaRequest<PageResponse<GroupLinkLabel>>(
    "get",
    "/api/group-link-labels",
    {
      params: { page: 1, pageSize: 1000, keyword }
    }
  );
}

export function createGroupLinkLabel(
  data: GroupLinkLabelWrite
): Promise<GroupLinkLabel> {
  return armadaRequest<GroupLinkLabel>("post", "/api/group-link-labels", {
    data
  });
}

export function createGroupLinkImportBatch(
  data: CreateGroupLinkImportBatchInput
) {
  return armadaRequest("post", "/api/group-links/import", { data: toFormData(data) }, {
    beforeRequestCallback: config => {
      delete config.headers["Content-Type"];
    }
  });
}

export function listGroupImportDetails(
  query: GroupImportDetailQuery
): Promise<PageResponse<GroupImportDetail>> {
  return armadaRequest<PageResponse<GroupImportDetail>>(
    "get",
    "/api/group-link-imports/details",
    {
      params: {
        labelId: query.labelId,
        batchId: query.batchId,
        page: query.page,
        pageSize: query.pageSize
      }
    }
  );
}

export function listGroupLinksForMigration(
  query: GroupLinkMigrationQuery
): Promise<PageResponse<GroupLinkForMigration>> {
  return armadaRequest<PageResponse<GroupLinkForMigration>>(
    "get",
    "/api/group-links",
    {
      params: {
        labelId: query.labelId,
        page: query.page,
        pageSize: query.pageSize,
        keyword: query.keyword
      }
    }
  );
}

export function migrateGroupLinks(data: GroupLinkMigrateInput): Promise<number> {
  return armadaRequest<number>("post", "/api/group-links/migrate", { data });
}

export function exportGroupImportGroupFailures(
  labelId?: number,
  batchId?: number
): Promise<Blob> {
  return http.request<Blob>("get", "/api/group-link-imports/failed/export", {
    params: { labelId, batchId },
    responseType: "blob"
  });
}

export function batchDeleteGroupImportGroups(ids: number[]): Promise<number> {
  return armadaRequest<number>("post", "/api/group-link-labels/batch-delete", {
    data: { ids }
  });
}
