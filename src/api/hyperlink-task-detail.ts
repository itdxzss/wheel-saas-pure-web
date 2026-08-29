import { armadaRequest } from "@/api/armada";
import { http } from "@/utils/http";
import type { PureHttpResponse } from "@/utils/http/types.d";

export type HyperlinkRecipientStatus =
  | "PENDING"
  | "SENDING"
  | "SUCCESS"
  | "DELIVERED"
  | "READ"
  | "FAILED"
  | "UNREGISTERED";

export type HyperlinkTaskDetailTab =
  | "recipients"
  | "accounts"
  | "clicks"
  | "visit-trend"
  | "ban-stats";

export type HyperlinkExportStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "EXPIRED";

export interface HyperlinkTaskSummary {
  id: number;
  taskName: string;
  recipientTotal: number;
  sendTotal: number;
  successNum: number;
  deliveredNum: number;
  readNum: number;
  failedNum: number;
  unregisteredNum: number;
  usedAccountCount: number;
  invalidAccountCount: number;
  clickUvNum: number;
  clickTotal: number;
  actualConcurrency: number;
  executionDurationSec: number;
  metricsUpdatedAt: number | null;
  firstVisitAt: number | null;
  lastVisitAt: number | null;
}

export interface HyperlinkRecipientItem {
  id: number;
  recipientPhone: string;
  recipientCountryIso2: string | null;
  accountId: number | null;
  senderPhone: string | null;
  senderCountryIso2: string | null;
  status: HyperlinkRecipientStatus;
  failCode: string | null;
  failReason: string | null;
  statusAt: number | null;
}

export interface HyperlinkRecipientQuery {
  page: number;
  pageSize: 10 | 20 | 50 | 100 | 200;
  phone?: string;
  recipientCountryIso2?: string;
  senderCountryIso2?: string;
  failReason?: string;
  sortField: "id";
  sortOrder: "asc" | "desc";
}

export type HyperlinkRecipientExportRequest = Omit<
  HyperlinkRecipientQuery,
  "page" | "pageSize"
>;

export interface PageResult<T> {
  list: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface HyperlinkTaskExportJob {
  id: number;
  exportType: "RECIPIENTS" | "ACCOUNT_STATS" | "ATTRIBUTION" | "VISIT_TREND";
  status: HyperlinkExportStatus;
  snapshotAt: number;
  fileName: string | null;
  rowCount: number;
  errorMessage: string | null;
  createdAt: number;
  finishedAt: number | null;
  downloadReady: boolean;
}

export interface HyperlinkTaskExportFile {
  filename: string;
  blob: Blob;
}

const DOWNLOAD_TIMEOUT_MS = 120000;

function normalizedQuery(query: HyperlinkRecipientQuery) {
  return {
    ...query,
    phone: query.phone?.trim() || undefined,
    recipientCountryIso2:
      query.recipientCountryIso2?.trim().toUpperCase() || undefined,
    senderCountryIso2:
      query.senderCountryIso2?.trim().toUpperCase() || undefined,
    failReason: query.failReason?.trim() || undefined
  };
}

function normalizedExportQuery(query: HyperlinkRecipientExportRequest) {
  const normalized = normalizedQuery({ ...query, page: 1, pageSize: 20 });
  const { page: _page, pageSize: _pageSize, ...request } = normalized;
  return request;
}

function headerValue(
  headers: PureHttpResponse["headers"],
  name: string
): string | undefined {
  const getter = headers as { get?: (key: string) => unknown };
  const viaGetter = getter.get?.(name);
  if (typeof viaGetter === "string") return viaGetter;
  const record = (headers ?? {}) as Record<string, unknown>;
  const entry = Object.entries(record).find(
    ([key]) => key.toLowerCase() === name.toLowerCase()
  );
  return typeof entry?.[1] === "string" ? entry[1] : undefined;
}

function filenameFromContentDisposition(value?: string): string | undefined {
  if (!value) return undefined;
  const encoded = /filename\*=(?:UTF-8'')?("?)([^";]+)\1/i.exec(value);
  const plain = /filename=("?)([^";]+)\1/i.exec(value);
  const filename = encoded?.[2] ?? plain?.[2];
  if (!filename) return undefined;
  try {
    return decodeURIComponent(filename);
  } catch {
    return filename;
  }
}

async function csvBlobError(blob: Blob): Promise<Error> {
  try {
    const payload = JSON.parse(await blob.text()) as { message?: unknown };
    if (typeof payload.message === "string" && payload.message.trim()) {
      return new Error(payload.message.trim());
    }
  } catch {
    // 非 JSON 错误统一回退，不向用户暴露响应解析细节。
  }
  return new Error("导出失败，请稍后重试。");
}

export function getHyperlinkTaskSummary(
  taskId: number
): Promise<HyperlinkTaskSummary> {
  return armadaRequest<HyperlinkTaskSummary>(
    "get",
    `/api/hyperlink-tasks/${taskId}/summary`
  );
}

export function listHyperlinkTaskRecipients(
  taskId: number,
  query: HyperlinkRecipientQuery
): Promise<PageResult<HyperlinkRecipientItem>> {
  return armadaRequest<PageResult<HyperlinkRecipientItem>>(
    "get",
    `/api/hyperlink-tasks/${taskId}/recipients`,
    { params: normalizedQuery(query) }
  );
}

export function createHyperlinkRecipientExport(
  taskId: number,
  query: HyperlinkRecipientExportRequest
): Promise<HyperlinkTaskExportJob> {
  return armadaRequest<HyperlinkTaskExportJob>(
    "post",
    `/api/hyperlink-tasks/${taskId}/recipients/export`,
    { data: normalizedExportQuery(query) }
  );
}

export function getHyperlinkTaskExport(
  jobId: number
): Promise<HyperlinkTaskExportJob> {
  return armadaRequest<HyperlinkTaskExportJob>(
    "get",
    `/api/hyperlink-task-exports/${jobId}`
  );
}

export async function downloadHyperlinkTaskExport(
  jobId: number
): Promise<HyperlinkTaskExportFile> {
  let contentType = "";
  let contentDisposition: string | undefined;
  const blob = await http.request<Blob>(
    "get",
    `/api/hyperlink-task-exports/${jobId}/download`,
    { responseType: "blob" },
    {
      beforeResponseCallback: response => {
        contentType = headerValue(response.headers, "Content-Type") ?? "";
        contentDisposition = headerValue(
          response.headers,
          "Content-Disposition"
        );
      },
      timeout: DOWNLOAD_TIMEOUT_MS
    }
  );
  const normalizedType = (contentType || blob.type).toLowerCase();
  if (
    normalizedType.includes("application/json") ||
    normalizedType.includes("application/problem+json")
  ) {
    throw await csvBlobError(blob);
  }
  if (normalizedType && !normalizedType.includes("text/csv")) {
    throw await csvBlobError(blob);
  }
  return {
    filename:
      filenameFromContentDisposition(contentDisposition) ??
      "hyperlink-recipients.csv",
    blob
  };
}
