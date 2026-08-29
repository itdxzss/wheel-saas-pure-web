import { armadaRequest } from "@/api/armada";
import { http } from "@/utils/http";

export interface PageResult<T> {
  list: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface HyperlinkAttributionQuery {
  page?: number;
  pageSize?: 10 | 20 | 50 | 100 | 200;
  recipientPhone?: string;
  senderPhone?: string;
  sortField?: "visitCount";
  sortOrder?: "asc" | "desc";
}

export interface HyperlinkAttributionItem {
  id: number;
  recipientPhone: string;
  senderPhone: string | null;
  visitCount: number;
  countryIso2: string | null;
  device: string | null;
  os: string | null;
  browser: string | null;
  language: string | null;
  ip: string | null;
  userAgent: string | null;
  firstVisitAt: number | null;
  lastVisitAt: number | null;
  attributionPurged: boolean;
  sensitiveVisible: boolean;
  maskedFields: string[];
}

export type VisitRange = "12h" | "24h" | "36h" | "48h" | "72h";
export type VisitGranularity = "30m" | "1h" | "2h";

export interface HyperlinkVisitTrend {
  range: VisitRange;
  granularity: VisitGranularity;
  pvBucketMode: "UNAVAILABLE_CUMULATIVE_ONLY" | string;
  summary: {
    uvTotal: number;
    clickRate: number;
    taskStartAt: number | null;
    firstVisitAt: number | null;
    peakBucketTime: number | null;
    peakNewUv: number;
    pvTotal: number;
    pvPerUv: number;
  };
  series: Array<{
    bucketTime: number;
    bucketEndTime: number;
    newUv: number;
    cumulativeUv: number;
    cumulativeClickRate: number;
    pv: number | null;
  }>;
  insights: Array<{
    eventType: "TASK_START" | "FIRST_VISIT" | "SURGE_START" | "PEAK";
    eventTime: number;
    title: string;
    detail: string | null;
  }>;
  topPeaks: Array<{
    rank: 1 | 2 | 3;
    bucketTime: number;
    bucketEndTime: number;
    newUv: number;
  }>;
}

export interface HyperlinkBanStats {
  invalidAccountCount: number;
  stats: Array<{
    reason: string;
    note: string | null;
    count: number;
    percentage: number;
  }>;
}

export interface ExportedCsv {
  blob: Blob;
  filename: string;
}

export type HyperlinkTaskExportStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "EXPIRED";

export interface HyperlinkTaskExportJob {
  id: number;
  exportType: "ATTRIBUTION" | "VISIT_TREND";
  status: HyperlinkTaskExportStatus;
  snapshotAt: number;
  fileName: string | null;
  rowCount: number;
  errorMessage: string | null;
  createdAt: number;
  finishedAt: number | null;
  downloadReady: boolean;
}

function trim(value?: string): string | undefined {
  return value?.trim() || undefined;
}

export function getHyperlinkAttribution(
  taskId: number,
  query: HyperlinkAttributionQuery
): Promise<PageResult<HyperlinkAttributionItem>> {
  return armadaRequest<PageResult<HyperlinkAttributionItem>>(
    "get",
    `/api/hyperlink-tasks/${taskId}/clicks`,
    {
      params: {
        ...query,
        recipientPhone: trim(query.recipientPhone),
        senderPhone: trim(query.senderPhone)
      }
    }
  );
}

export function getHyperlinkVisitTrend(
  taskId: number,
  range: VisitRange,
  granularity: VisitGranularity
): Promise<HyperlinkVisitTrend> {
  return armadaRequest<HyperlinkVisitTrend>(
    "get",
    `/api/hyperlink-tasks/${taskId}/visit-trend`,
    { params: { range, granularity } }
  );
}

export function getHyperlinkBanStats(
  taskId: number
): Promise<HyperlinkBanStats> {
  return armadaRequest<HyperlinkBanStats>(
    "get",
    `/api/hyperlink-tasks/${taskId}/ban-stats`
  );
}

export function exportHyperlinkAttribution(
  taskId: number,
  query: HyperlinkAttributionQuery
): Promise<HyperlinkTaskExportJob> {
  return armadaRequest<HyperlinkTaskExportJob>(
    "post",
    `/api/hyperlink-tasks/${taskId}/click-attribution/export`,
    {
      data: {
        ...query,
        recipientPhone: trim(query.recipientPhone),
        senderPhone: trim(query.senderPhone)
      }
    }
  );
}

export function exportHyperlinkVisitTrend(
  taskId: number,
  range: VisitRange,
  granularity: VisitGranularity
): Promise<HyperlinkTaskExportJob> {
  return armadaRequest<HyperlinkTaskExportJob>(
    "post",
    `/api/hyperlink-tasks/${taskId}/visit-trend/export`,
    { data: { range, granularity } }
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
  job: HyperlinkTaskExportJob
): Promise<ExportedCsv> {
  let filename = job.fileName || `hyperlink-task-export-${job.id}.csv`;
  const blob = await http.request<Blob>(
    "get",
    `/api/hyperlink-task-exports/${job.id}/download`,
    { responseType: "blob" },
    {
      beforeResponseCallback: response => {
        const disposition = Object.entries(response.headers ?? {}).find(
          ([name]) => name.toLowerCase() === "content-disposition"
        )?.[1];
        const match =
          typeof disposition === "string"
            ? disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)/i)
            : null;
        if (match?.[1]) filename = decodeURIComponent(match[1]);
      }
    }
  );
  return { blob, filename };
}

export async function waitForHyperlinkTaskExport(
  initial: HyperlinkTaskExportJob,
  signal?: AbortSignal
): Promise<HyperlinkTaskExportJob> {
  let job = initial;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (job.status === "SUCCESS") return job;
    if (job.status === "FAILED" || job.status === "EXPIRED") {
      throw new Error(job.errorMessage || "导出作业未成功完成");
    }
    await new Promise<void>((resolve, reject) => {
      const onAbort = () => {
        window.clearTimeout(timer);
        reject(new DOMException("导出已取消", "AbortError"));
      };
      const timer = window.setTimeout(() => {
        signal?.removeEventListener("abort", onAbort);
        resolve();
      }, 1000);
      if (signal?.aborted) onAbort();
      else signal?.addEventListener("abort", onAbort, { once: true });
    });
    job = await getHyperlinkTaskExport(job.id);
  }
  throw new Error("导出作业等待超时，请稍后在导出记录中查看");
}

export function formatHyperlinkTime(value?: number | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(new Date(value));
}
