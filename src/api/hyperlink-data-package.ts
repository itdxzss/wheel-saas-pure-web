import { armadaRequest } from "@/api/armada";
import { http } from "@/utils/http";

export type DataPackageImportMode = "APPEND" | "OVERWRITE";
export type DataPackageClickExportFormat = "txt" | "csv";
export type HyperlinkClickAnalysisMode = "never-click" | "uv-ratio";
export type HyperlinkClickAnalysisDimension = "recipient_country";
export type DataPackageUsageStatus =
  | "all"
  | "unused"
  | "success"
  | "single"
  | "double"
  | "failed"
  | "fail_404";

export type DataPackagePoolStatus =
  | "UNUSED"
  | "CLAIMED"
  | "SENT"
  | "DELIVERED"
  | "RETRYABLE_FAILED"
  | "UNREGISTERED";

export interface PageResult<T> {
  list: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface DataPackageMetrics {
  totalCount: number;
  unusedCount: number;
  usedCount: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  unregisteredCount: number;
  clickUvCount: number;
}

export interface DataPackageListItem {
  id: number;
  name: string;
  remark: string | null;
  countries: Array<string | null>;
  primaryCountryIso2: string | null;
  metrics: DataPackageMetrics;
  version: number;
  createdAt: number;
  updatedAt: number;
}

export interface DataPackageDetail extends DataPackageListItem {
  currentGeneration: number;
}

export interface DataPackagePhoneItem {
  id: number;
  generation: number;
  phone: string;
  countryIso2: string | null;
  poolStatus: DataPackagePoolStatus;
  sourceImportId: number;
  createdAt: number;
}

export interface DataPackageCountryOption {
  value: string;
  countryIso2: string | null;
  nameZh: string;
}

export interface DataPackageImportResult {
  importId: number;
  mode: DataPackageImportMode;
  generation: number;
  totalRows: number;
  acceptedRows: number;
  invalidRows: number;
  duplicatedRows: number;
  phoneCountAfterImport: number;
}

export interface DataPackageListQuery {
  page?: number;
  pageSize?: number;
  name?: string | null;
  createdFrom?: number;
  createdTo?: number;
  countryIso2s?: string[];
  minUvPercent?: number;
  maxUvPercent?: number;
  forTask?: boolean;
}

export interface DataPackageExportResult {
  blob: Blob;
  filename: string;
  exportedCount: number;
}

export interface HyperlinkClickAnalysisBucket {
  threshold: number;
  count: number;
  percent: number;
}

export interface HyperlinkClickAnalysisCountry {
  countryIso2: string;
  totalPhones: number;
  buckets: HyperlinkClickAnalysisBucket[];
}

export interface HyperlinkClickAnalysisResult {
  mode: HyperlinkClickAnalysisMode;
  totalPhones: number;
  buckets: HyperlinkClickAnalysisBucket[];
  countries: HyperlinkClickAnalysisCountry[];
  factSourceReady: boolean;
}

export interface HyperlinkClickAnalysisQuery {
  dateFrom: number;
  dateTo: number;
  thresholds: number[];
  dimension?: HyperlinkClickAnalysisDimension;
  countryIso2?: string;
}

export interface HyperlinkClickAnalysisExportInput {
  dateFrom: number;
  dateTo: number;
  threshold: number;
  countryIso2?: string;
}

export interface DataPackagePhoneQuery {
  page?: number;
  pageSize?: number;
  phone?: string | null;
  poolStatus?: DataPackagePoolStatus;
  countryIso2?: string | null;
}

export interface DataPackageCreateInput {
  name: string;
  remark: string | null;
}

export interface DataPackageUpdateInput extends DataPackageCreateInput {
  version: number;
}

export interface DataPackageImportInput {
  mode: DataPackageImportMode;
  file: File;
}

function optionalTrimmed(value?: string | null): string | undefined {
  return value?.trim() || undefined;
}

function nullableTrimmed(value: string | null): string | null {
  return value?.trim() || null;
}

function countryListParam(values?: string[]): string | undefined {
  const normalized = [
    ...new Set(
      (values ?? []).map(value => value.trim().toUpperCase()).filter(Boolean)
    )
  ];
  return normalized.length > 0 ? normalized.join(",") : undefined;
}

export function listDataPackages(
  query: DataPackageListQuery = {}
): Promise<PageResult<DataPackageListItem>> {
  return armadaRequest<PageResult<DataPackageListItem>>(
    "get",
    "/api/data-packages",
    {
      params: {
        page: query.page,
        pageSize: query.pageSize,
        name: optionalTrimmed(query.name),
        createdFrom: query.createdFrom,
        createdTo: query.createdTo,
        countryIso2s: countryListParam(query.countryIso2s),
        minUvPercent: query.minUvPercent,
        maxUvPercent: query.maxUvPercent,
        forTask: query.forTask
      }
    }
  );
}

export function getDataPackage(id: number): Promise<DataPackageDetail> {
  return armadaRequest<DataPackageDetail>("get", `/api/data-packages/${id}`);
}

export function createDataPackage(
  input: DataPackageCreateInput
): Promise<DataPackageDetail> {
  return armadaRequest<DataPackageDetail>("post", "/api/data-packages", {
    data: {
      name: input.name.trim(),
      remark: nullableTrimmed(input.remark)
    }
  });
}

export function updateDataPackage(
  id: number,
  input: DataPackageUpdateInput
): Promise<DataPackageDetail> {
  return armadaRequest<DataPackageDetail>("put", `/api/data-packages/${id}`, {
    data: {
      name: input.name.trim(),
      remark: nullableTrimmed(input.remark),
      version: input.version
    }
  });
}

export function importDataPackagePhones(
  id: number,
  input: DataPackageImportInput
): Promise<DataPackageImportResult> {
  const formData = new FormData();
  formData.append("mode", input.mode);
  formData.append("file", input.file);
  return armadaRequest<DataPackageImportResult>(
    "post",
    `/api/data-packages/${id}/import`,
    { data: formData },
    {
      timeout: 120000,
      beforeRequestCallback: config => {
        delete config.headers["Content-Type"];
      }
    }
  );
}

export function listDataPackagePhones(
  id: number,
  query: DataPackagePhoneQuery = {}
): Promise<PageResult<DataPackagePhoneItem>> {
  return armadaRequest<PageResult<DataPackagePhoneItem>>(
    "get",
    `/api/data-packages/${id}/phones`,
    {
      params: {
        page: query.page,
        pageSize: query.pageSize,
        phone: optionalTrimmed(query.phone),
        poolStatus: query.poolStatus,
        countryIso2: optionalTrimmed(query.countryIso2)?.toUpperCase()
      }
    }
  );
}

export function listDataPackageCountries(): Promise<
  DataPackageCountryOption[]
> {
  return armadaRequest<DataPackageCountryOption[]>(
    "get",
    "/api/data-packages/countries"
  );
}

export function deleteDataPackage(id: number): Promise<null> {
  return armadaRequest<null>("delete", `/api/data-packages/${id}`);
}

export function resetDataPackageFailed(id: number): Promise<number> {
  return armadaRequest<number>("post", `/api/data-packages/${id}/reset-failed`);
}

export function exportDataPackagePhones(
  id: number,
  usageStatus: DataPackageUsageStatus
): Promise<DataPackageExportResult> {
  return requestDataPackageExport(
    "get",
    `/api/data-packages/${id}/export`,
    { params: { usageStatus } },
    `data_package_${id}_${usageStatus}.txt`
  );
}

export function exportDataPackagePhonesBatch(
  ids: number[],
  usageStatus: DataPackageUsageStatus
): Promise<DataPackageExportResult> {
  return requestDataPackageExport(
    "post",
    "/api/data-packages/export",
    { data: { ids, usageStatus } },
    `data_packages_${usageStatus}.txt`
  );
}

export function exportDataPackageClickRecords(
  ids: number[],
  format: DataPackageClickExportFormat
): Promise<DataPackageExportResult> {
  return requestDataPackageExport(
    "post",
    "/api/data-packages/clicks/export",
    { data: { ids, format } },
    `data_package_click_records.${format}`
  );
}

export function getHyperlinkClickAnalysis(
  mode: HyperlinkClickAnalysisMode,
  query: HyperlinkClickAnalysisQuery
): Promise<HyperlinkClickAnalysisResult> {
  return armadaRequest<HyperlinkClickAnalysisResult>(
    "get",
    `/api/hyperlink-tasks/click-analysis/${mode}`,
    {
      params: {
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        thresholds: query.thresholds.join(","),
        dimension: query.dimension,
        countryIso2: optionalTrimmed(query.countryIso2)?.toUpperCase()
      }
    }
  );
}

export function exportHyperlinkClickAnalysis(
  mode: HyperlinkClickAnalysisMode,
  input: HyperlinkClickAnalysisExportInput
): Promise<DataPackageExportResult> {
  return requestDataPackageExport(
    "post",
    `/api/hyperlink-tasks/click-analysis/${mode}/export`,
    {
      data: {
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        threshold: input.threshold,
        countryIso2: optionalTrimmed(input.countryIso2)?.toUpperCase(),
        format: "txt"
      }
    },
    `hyperlink_click_analysis_${mode}_${input.threshold}.txt`
  );
}

async function requestDataPackageExport(
  method: "get" | "post",
  url: string,
  options: Record<string, unknown>,
  fallbackFilename: string
): Promise<DataPackageExportResult> {
  let filename = fallbackFilename;
  let exportedCount = 0;
  const blob = await http.request<Blob>(
    method,
    url,
    { ...options, responseType: "blob" },
    {
      beforeResponseCallback: response => {
        filename =
          filenameFromDisposition(
            headerValue(response.headers, "Content-Disposition")
          ) ?? fallbackFilename;
        exportedCount = Number(
          headerValue(response.headers, "X-Export-Count") ?? 0
        );
      }
    }
  );
  return { blob, filename, exportedCount };
}

function headerValue(headers: unknown, name: string): string | undefined {
  if (!headers || typeof headers !== "object") return undefined;
  const values = headers as Record<string, unknown>;
  const entry = Object.entries(values).find(
    ([key]) => key.toLowerCase() === name.toLowerCase()
  );
  return typeof entry?.[1] === "string" ? entry[1] : undefined;
}

function filenameFromDisposition(value?: string): string | undefined {
  const encoded = value?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      return encoded;
    }
  }
  return value?.match(/filename="?([^";]+)"?/i)?.[1];
}
