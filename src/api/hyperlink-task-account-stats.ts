import { armadaRequest } from "@/api/armada";
import { http } from "@/utils/http";
import type { PureHttpResponse } from "@/utils/http/types.d";

export type HyperlinkAccountType = "PERSONAL" | "BUSINESS";
export type HyperlinkAccountStatSortField =
  | "successNum"
  | "deliveredNum"
  | "failedNum";
export type HyperlinkSortOrder = "asc" | "desc";

export interface HyperlinkAccountStatItem {
  bucketKey: number;
  accountId: number | null;
  senderPhone: string | null;
  senderCountryIso2: string | null;
  accountType: HyperlinkAccountType | null;
  retentionDays: number;
  successNum: number;
  deliveredNum: number;
  failedNum: number;
  lastSendAt: number | null;
}

export interface HyperlinkAccountStatFilter {
  startAt?: number;
  endAt?: number;
  senderCountryIso2?: string;
  successRateMin?: number;
  successRateMax?: number;
  sortField?: HyperlinkAccountStatSortField;
  sortOrder?: HyperlinkSortOrder;
}

export interface HyperlinkAccountStatQuery extends HyperlinkAccountStatFilter {
  page?: number;
  pageSize?: number;
}

export interface HyperlinkPageResult<T> {
  list: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type HyperlinkTaskExportStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "EXPIRED";

export interface HyperlinkTaskExportJob {
  id: number;
  exportType: "ACCOUNT_STATS" | "RECIPIENTS" | "ATTRIBUTION" | "VISIT_TREND";
  status: HyperlinkTaskExportStatus;
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

function definedParams(
  query: HyperlinkAccountStatQuery
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(query).filter(
      ([, value]) => value !== undefined && value !== ""
    )
  );
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

function filenameFromDisposition(value?: string): string | undefined {
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

async function downloadError(blob: Blob): Promise<Error> {
  try {
    const payload = JSON.parse(await blob.text()) as { message?: unknown };
    if (typeof payload.message === "string" && payload.message.trim()) {
      return new Error(payload.message.trim());
    }
  } catch {
    // 非 JSON 网关响应统一回退为稳定提示。
  }
  return new Error("导出失败，请稍后重试。");
}

export function listHyperlinkAccountStats(
  taskId: number,
  query: HyperlinkAccountStatQuery
): Promise<HyperlinkPageResult<HyperlinkAccountStatItem>> {
  return armadaRequest<HyperlinkPageResult<HyperlinkAccountStatItem>>(
    "get",
    `/api/hyperlink-tasks/${taskId}/account-stats`,
    { params: definedParams(query) }
  );
}

export function createHyperlinkAccountStatsExport(
  taskId: number,
  data: HyperlinkAccountStatFilter
): Promise<HyperlinkTaskExportJob> {
  return armadaRequest<HyperlinkTaskExportJob>(
    "post",
    `/api/hyperlink-tasks/${taskId}/account-stats/export`,
    { data: definedParams(data) }
  );
}

export function getHyperlinkTaskExportJob(
  jobId: number
): Promise<HyperlinkTaskExportJob> {
  return armadaRequest<HyperlinkTaskExportJob>(
    "get",
    `/api/hyperlink-task-exports/${jobId}`
  );
}

export async function downloadHyperlinkTaskExportJob(
  jobId: number
): Promise<HyperlinkTaskExportFile> {
  let contentType = "";
  let disposition: string | undefined;
  const blob = await http.request<Blob>(
    "get",
    `/api/hyperlink-task-exports/${jobId}/download`,
    { responseType: "blob" },
    {
      beforeResponseCallback: response => {
        contentType = headerValue(response.headers, "Content-Type") ?? "";
        disposition = headerValue(response.headers, "Content-Disposition");
      },
      timeout: DOWNLOAD_TIMEOUT_MS
    }
  );
  const normalizedType = (contentType || blob.type).toLowerCase();
  if (
    normalizedType.includes("application/json") ||
    normalizedType.includes("application/problem+json")
  ) {
    throw await downloadError(blob);
  }
  const filename =
    filenameFromDisposition(disposition) ?? "hyperlink-account-stats.csv";
  if (
    normalizedType &&
    !normalizedType.includes("text/csv") &&
    !filename.toLowerCase().endsWith(".csv")
  ) {
    throw await downloadError(blob);
  }
  return { filename, blob };
}
