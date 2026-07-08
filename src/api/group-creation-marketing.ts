import { armadaRequest } from "@/api/armada";
import { http } from "@/utils/http";
import type { PageResponse } from "@/api/account";
import type { PureHttpResponse } from "@/utils/http/types.d";

export type GroupCreationMarketingTaskStatus = 1 | 2 | 3 | 4 | 5 | 6;
export type GroupCreationMarketingItemStatus = 1 | 2 | 3 | 4 | 5 | 6;

export interface GroupCreationMarketingMaterialPayload {
  fileName: string;
  content: string;
}

export interface GroupCreationMarketingAccountCandidateRow {
  accountId: number;
  accountPhone: string;
  protocolAccountId?: string | null;
  accountState?: number | null;
  loginState?: number | null;
  riskStatus?: number | null;
  muteStatus?: number | null;
}

export interface CreateGroupCreationMarketingTaskPayload {
  taskName: string;
  accountGroupId: number;
  accountGroupName: string;
  marketingTemplateId: number;
  marketingTemplateName: string;
  sendIntervalSeconds: number;
  groupNamePrefix?: string | null;
  remark?: string | null;
  materials: GroupCreationMarketingMaterialPayload[];
}

export interface GroupCreationMarketingTaskRow {
  id: number;
  taskName: string;
  accountGroupId: number;
  accountGroupName: string;
  marketingTemplateId: number;
  marketingTemplateName: string;
  marketingTaskId?: number | null;
  status: GroupCreationMarketingTaskStatus;
  matchedItemCount: number;
  unmatchedFileCount: number;
  successCount: number;
  failedCount: number;
  abandonedCount: number;
  sendIntervalSeconds: number;
  groupNamePrefix?: string | null;
  remark?: string | null;
  finishedAt?: number | null;
  createdAt?: number | null;
  updatedAt?: number | null;
}

export interface GroupCreationMarketingItemRow {
  id: number;
  fileIndex: number;
  fileName: string;
  participantCount: number;
  accountId: number;
  accountPhone: string;
  protocolAccountId?: string | null;
  groupSubject: string;
  groupJid?: string | null;
  groupLinkId?: number | null;
  marketingTaskId?: number | null;
  marketingTargetId?: number | null;
  marketingAttemptId?: number | null;
  commandId?: string | null;
  status: GroupCreationMarketingItemStatus;
  reasonCode?: string | null;
  reasonMessage?: string | null;
  startedAt?: number | null;
  finishedAt?: number | null;
  createdAt?: number | null;
  updatedAt?: number | null;
}

export interface GroupCreationMarketingTaskDetail
  extends GroupCreationMarketingTaskRow {
  items: GroupCreationMarketingItemRow[];
}

export interface GroupCreationMarketingTaskExport {
  filename: string;
  blob: Blob;
}

export interface GroupCreationMarketingTaskQuery {
  page?: number;
  pageSize?: number;
  id?: number;
  keyword?: string;
  status?: GroupCreationMarketingTaskStatus | "";
}

function toListParams(query: GroupCreationMarketingTaskQuery) {
  return {
    page: query.page,
    pageSize: query.pageSize,
    id: query.id,
    keyword: query.keyword,
    status: query.status || undefined
  };
}

function headerValue(
  headers: PureHttpResponse["headers"],
  name: string
): string | undefined {
  const getter = headers as { get?: (key: string) => unknown };
  const viaGetter = getter.get?.(name);
  if (typeof viaGetter === "string") return viaGetter;

  const record = headers as Record<string, unknown>;
  const direct = record[name] ?? record[name.toLowerCase()];
  return typeof direct === "string" ? direct : undefined;
}

function decodeFilename(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function filenameFromContentDisposition(value?: string): string | undefined {
  if (!value) return undefined;

  const encoded = /filename\*=(?:UTF-8'')?("?)([^";]+)\1/i.exec(value);
  if (encoded?.[2]) {
    return decodeFilename(encoded[2]);
  }

  const plain = /filename=("?)([^";]+)\1/i.exec(value);
  return plain?.[2];
}

export function listGroupCreationMarketingTasks(
  query: GroupCreationMarketingTaskQuery = {}
): Promise<PageResponse<GroupCreationMarketingTaskRow>> {
  return armadaRequest<PageResponse<GroupCreationMarketingTaskRow>>(
    "get",
    "/api/group-creation-marketing-tasks",
    { params: toListParams(query) }
  );
}

export function listGroupCreationMarketingAccountCandidates(
  accountGroupId: number
): Promise<GroupCreationMarketingAccountCandidateRow[]> {
  return armadaRequest<GroupCreationMarketingAccountCandidateRow[]>(
    "get",
    "/api/group-creation-marketing-tasks/account-candidates",
    { params: { accountGroupId } }
  );
}

export function createGroupCreationMarketingTask(
  data: CreateGroupCreationMarketingTaskPayload
): Promise<GroupCreationMarketingTaskDetail> {
  return armadaRequest<GroupCreationMarketingTaskDetail>(
    "post",
    "/api/group-creation-marketing-tasks",
    { data }
  );
}

export function stopGroupCreationMarketingTask(id: number): Promise<number> {
  return armadaRequest<number>(
    "post",
    `/api/group-creation-marketing-tasks/${id}/stop`
  );
}

export function getGroupCreationMarketingTaskDetail(
  id: number
): Promise<GroupCreationMarketingTaskDetail> {
  return armadaRequest<GroupCreationMarketingTaskDetail>(
    "get",
    `/api/group-creation-marketing-tasks/${id}`
  );
}

export function exportGroupCreationMarketingTasks(
  ids: number[]
): Promise<GroupCreationMarketingTaskExport> {
  let filename: string | undefined;
  return http
    .request<Blob>(
      "post",
      "/api/group-creation-marketing-tasks/export",
      {
        data: { ids },
        responseType: "blob"
      },
      {
        beforeResponseCallback: response => {
          filename = filenameFromContentDisposition(
            headerValue(response.headers, "Content-Disposition")
          );
        }
      }
    )
    .then(blob => ({
      filename: filename || "建群营销统计导出.xlsx",
      blob
    }));
}
