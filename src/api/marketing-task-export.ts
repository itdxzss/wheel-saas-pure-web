import { armadaRequest } from "@/api/armada";
import { http } from "@/utils/http";
import type { PureHttpResponse } from "@/utils/http/types.d";

export type MarketingTaskExportMode = "COUNTRY_ENTRY" | "FULL";
export type MarketingTaskExportStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED";

export interface MarketingTaskExportCountry {
  iso2: string;
  nameZh: string;
  nameEn: string;
  phonePrefix: string;
  flag: string;
}

export interface CreateMarketingTaskExportRequest {
  exportMode: MarketingTaskExportMode;
  taskIds: number[];
  countryIso2s: string[];
}

export interface MarketingTaskExportJob {
  id: number;
  exportMode: MarketingTaskExportMode;
  status: MarketingTaskExportStatus;
  fileName?: string | null;
  summaryRowCount: number;
  detailRowCount: number;
  snapshotAt: number;
  createdAt: number;
  finishedAt?: number | null;
  errorMessage?: string | null;
  downloadReady: boolean;
}

interface MarketingTaskExportCountryOptionsResponse {
  rows?: Array<MarketingTaskExportCountry & { value?: string }> | null;
}

export interface MarketingTaskExportFile {
  filename: string;
  blob: Blob;
}

const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const DOWNLOAD_TIMEOUT_MS = 120000;

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

async function jsonBlobError(blob: Blob): Promise<Error> {
  try {
    const payload = JSON.parse(await blob.text()) as { message?: unknown };
    if (typeof payload.message === "string" && payload.message.trim()) {
      return new Error(payload.message.trim());
    }
  } catch {
    // 统一回退，不把响应解析细节暴露给用户。
  }
  return new Error("导出失败，请稍后重试或联系技术人员。");
}

async function isXlsxBlob(blob: Blob): Promise<boolean> {
  if (blob.size < 4) return false;
  const signature = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  return (
    signature[0] === 0x50 &&
    signature[1] === 0x4b &&
    signature[2] === 0x03 &&
    signature[3] === 0x04
  );
}

export function listMarketingTaskExportCountries(): Promise<
  MarketingTaskExportCountry[]
> {
  return armadaRequest<MarketingTaskExportCountryOptionsResponse>(
    "get",
    "/api/admin/countries/options",
    { params: { scope: "marketing-export" } }
  ).then(result =>
    (result.rows ?? []).filter(
      country => /^[A-Z]{2}$/i.test(country.iso2) && country.value !== "MIXED"
    )
  );
}

export function createMarketingTaskExport(
  data: CreateMarketingTaskExportRequest
): Promise<MarketingTaskExportJob> {
  return armadaRequest<MarketingTaskExportJob>(
    "post",
    "/api/marketing-task-exports",
    { data }
  );
}

export function getMarketingTaskExport(
  jobId: number
): Promise<MarketingTaskExportJob> {
  return armadaRequest<MarketingTaskExportJob>(
    "get",
    `/api/marketing-task-exports/${jobId}`
  );
}

export async function downloadMarketingTaskExport(
  jobId: number
): Promise<MarketingTaskExportFile> {
  let contentType = "";
  let contentDisposition: string | undefined;
  const blob = await http.request<Blob>(
    "get",
    `/api/marketing-task-exports/${jobId}/download`,
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

  const normalizedContentType = (contentType || blob.type).toLowerCase();
  if (
    normalizedContentType.includes("application/json") ||
    normalizedContentType.includes("application/problem+json")
  ) {
    throw await jsonBlobError(blob);
  }
  if (!(await isXlsxBlob(blob))) {
    throw await jsonBlobError(blob);
  }
  if (
    normalizedContentType &&
    !normalizedContentType.includes(XLSX_CONTENT_TYPE)
  ) {
    const dispositionFilename =
      filenameFromContentDisposition(contentDisposition);
    if (!dispositionFilename?.toLowerCase().endsWith(".xlsx")) {
      throw new Error("导出失败，请稍后重试或联系技术人员。");
    }
  }

  return {
    filename:
      filenameFromContentDisposition(contentDisposition) ??
      "营销任务数据导出.xlsx",
    blob
  };
}
