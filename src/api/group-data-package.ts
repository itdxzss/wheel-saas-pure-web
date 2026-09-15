import { armadaRequest } from "@/api/armada";
import { http } from "@/utils/http";

/** 合同：Armada docs/business/group-pull-data-package-api-contract.md。 */
export type GroupDataPackageImportMode = "append" | "overwrite";
export type GroupDataPackageExportStatus =
  | "all"
  | "unused"
  | "success"
  | "failed"
  | "privacy_rejected";
export type GroupDataPackageExportFormat = "txt" | "csv";
export type GroupDataPackagePhoneStatus =
  | "UNUSED"
  | "CLAIMED"
  | "SUCCESS"
  | "RETRYABLE_FAILED"
  | "PRIVACY_REJECTED"
  | "UNREGISTERED"
  | "UNKNOWN";

export interface GroupDataPackagePage<T> {
  list: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface GroupDataPackageMetrics {
  totalCount: number;
  unusedCount: number;
  claimedCount: number;
  successCount: number;
  failedCount: number;
  privacyRejectedCount: number;
  unregisteredCount: number;
  unknownCount: number;
}

export interface GroupDataPackage {
  id: number;
  name: string;
  remark: string | null;
  generation: number;
  version: number;
  primaryCountryIso2: string | null;
  continent: string | null;
  usageBusinesses: string[];
  metrics: GroupDataPackageMetrics;
  createdAt: number;
  updatedAt: number;
}

export interface GroupDataPackageCountry {
  iso2: string;
  nameZh: string;
  continent: string | null;
}

export interface GroupDataPackagePhone {
  id: number;
  phone: string;
  adminRequired: boolean;
  memberSeq: number;
  sourceLineNo: number;
  countryIso2: string | null;
  status: GroupDataPackagePhoneStatus;
  createdAt: number;
}

export interface GroupDataPackageImportResult {
  importId: number;
  mode: GroupDataPackageImportMode;
  generation: number;
  totalRows: number;
  acceptedRows: number;
  invalidRows: number;
  duplicatedRows: number;
  privacyFilteredRows: number;
  phoneCountAfterImport: number;
}

export interface GroupDataPackageImportRecord {
  id: number;
  mode: GroupDataPackageImportMode;
  fileName: string;
  generation: number;
  status: 1 | 2 | 3;
  totalRows: number;
  acceptedRows: number;
  invalidRows: number;
  duplicatedRows: number;
  privacyFilteredRows: number;
  failureReason: string | null;
  createdBy: number;
  createdAt: number;
  finishedAt: number | null;
}

export interface GroupDataPackageQuery {
  page?: number;
  pageSize?: number;
  name?: string;
  countryIso2?: string;
  continent?: string;
  usageBusiness?: string;
  createdFrom?: number;
  createdTo?: number;
  forTask?: boolean;
}

export interface GroupDataPackageMetadata {
  name: string;
  remark: string | null;
}

export interface GroupDataPackageImportInput {
  file: File;
  mode: GroupDataPackageImportMode;
  privacyFilterDays: number;
}

export interface GroupDataPackageDownload {
  blob: Blob;
  filename: string;
  exportedCount: number;
}

const ROOT = "/api/group-data-packages";

export function listGroupDataPackages(
  query: GroupDataPackageQuery = {}
): Promise<GroupDataPackagePage<GroupDataPackage>> {
  return armadaRequest("get", ROOT, {
    params: {
      ...query,
      name: query.name?.trim() || undefined,
      countryIso2: query.countryIso2?.trim().toUpperCase() || undefined,
      continent: query.continent || undefined,
      usageBusiness: query.usageBusiness || undefined
    }
  });
}

export function listGroupDataPackageCountries(): Promise<
  GroupDataPackageCountry[]
> {
  return armadaRequest("get", `${ROOT}/countries`);
}

export function getGroupDataPackage(id: number): Promise<GroupDataPackage> {
  return armadaRequest("get", `${ROOT}/${id}`);
}

export function createGroupDataPackage(
  input: GroupDataPackageMetadata
): Promise<GroupDataPackage> {
  return armadaRequest("post", ROOT, {
    data: { name: input.name.trim(), remark: input.remark?.trim() || null }
  });
}

export function updateGroupDataPackage(
  id: number,
  input: GroupDataPackageMetadata & { version: number }
): Promise<GroupDataPackage> {
  return armadaRequest("put", `${ROOT}/${id}`, {
    data: {
      ...input,
      name: input.name.trim(),
      remark: input.remark?.trim() || null
    }
  });
}

export function importGroupDataPackage(
  id: number,
  input: GroupDataPackageImportInput
): Promise<GroupDataPackageImportResult> {
  const data = new FormData();
  data.append("file", input.file);
  data.append("mode", input.mode);
  data.append("privacyFilterDays", String(input.privacyFilterDays));
  return armadaRequest(
    "post",
    `${ROOT}/${id}/import`,
    { data },
    {
      timeout: 120_000,
      beforeRequestCallback: config => {
        delete config.headers["Content-Type"];
      }
    }
  );
}

export function listGroupDataPackagePhones(
  id: number,
  query: {
    page?: number;
    pageSize?: number;
    phone?: string;
    status?: GroupDataPackagePhoneStatus;
  }
): Promise<GroupDataPackagePage<GroupDataPackagePhone>> {
  return armadaRequest("get", `${ROOT}/${id}/phones`, {
    params: { ...query, phone: query.phone?.trim() || undefined }
  });
}

export function listGroupDataPackageImports(
  id: number,
  query: { page?: number; pageSize?: number } = {}
): Promise<GroupDataPackagePage<GroupDataPackageImportRecord>> {
  return armadaRequest("get", `${ROOT}/${id}/imports`, { params: query });
}

export function resetGroupDataPackageFailed(id: number): Promise<number> {
  return armadaRequest("post", `${ROOT}/${id}/reset-failed`);
}

export function deleteGroupDataPackage(id: number): Promise<void> {
  return armadaRequest("delete", `${ROOT}/${id}`);
}

export function exportGroupDataPackage(
  id: number,
  usageStatus: GroupDataPackageExportStatus,
  format: GroupDataPackageExportFormat
): Promise<GroupDataPackageDownload> {
  return requestDownload(
    "get",
    `${ROOT}/${id}/export`,
    { params: { usageStatus, format } },
    `拉群数据包_${id}_${usageStatus}.${format}`
  );
}

export function exportGroupDataPackages(
  ids: number[],
  usageStatus: GroupDataPackageExportStatus,
  format: GroupDataPackageExportFormat
): Promise<GroupDataPackageDownload> {
  return requestDownload(
    "post",
    `${ROOT}/export`,
    { data: { ids, usageStatus, format } },
    `拉群数据包_批量_${usageStatus}.${format}`
  );
}

async function requestDownload(
  method: "get" | "post",
  url: string,
  options: Record<string, unknown>,
  fallback: string
): Promise<GroupDataPackageDownload> {
  let filename = fallback;
  let exportedCount = 0;
  const blob = await http.request<Blob>(
    method,
    url,
    { ...options, responseType: "blob" },
    {
      beforeResponseCallback: response => {
        const headers = response.headers as Record<string, unknown>;
        const header = (name: string): string =>
          String(
            Object.entries(headers).find(
              ([key]) => key.toLowerCase() === name.toLowerCase()
            )?.[1] ?? ""
          );
        filename = groupPackageDownloadFilename(
          header("Content-Disposition"),
          fallback
        );
        exportedCount = Number(header("X-Export-Count")) || 0;
      }
    }
  );
  if (blob.type.includes("json")) {
    const result: unknown = JSON.parse(await blob.text());
    const message =
      result && typeof result === "object" && "message" in result
        ? String(result.message)
        : "导出失败，请重试";
    throw new Error(message);
  }
  return { blob, filename, exportedCount };
}

export function groupPackageDownloadFilename(
  disposition: string,
  fallback: string
): string {
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      return fallback;
    }
  }
  return disposition.match(/filename="?([^";]+)"?/i)?.[1] || fallback;
}
