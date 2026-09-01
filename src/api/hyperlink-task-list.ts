import { armadaRequest } from "@/api/armada";
import { http } from "@/utils/http";

export type HyperlinkTaskMode = "instant" | "rolling" | "cycle";
export type HyperlinkPricingMode = "NORMAL" | "SUPER";
export type HyperlinkTaskRunStatus = 0 | 1 | 2 | 3 | 4;
export type HyperlinkProvisionStatus =
  | "NOT_REQUIRED"
  | "PROCESSING"
  | "READY"
  | "FAILED";
export type HyperlinkTaskAction = "PAUSE" | "RESUME" | "STOP";

export interface PageResult<T> {
  list: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface HyperlinkFilterOption {
  value: string | number;
  label: string;
}

export interface HyperlinkTaskCreateContext {
  pricingMode: HyperlinkPricingMode;
  priceCode: string;
  currencyCode: string;
  referenceUnitPrice: number;
  accountBalance: number;
  giftBalance: number;
  availableBalance: number;
  protocolCount: number;
  maxConcurrentNum: number;
  accountSendConcurrency: 20;
  defaultSubTaskNum: 50;
  defaultAccountGroupIds: number[];
  groupOptions: HyperlinkFilterOption[];
  countryOptions: HyperlinkFilterOption[];
  channelOptions: HyperlinkFilterOption[];
  protocolOptions: HyperlinkFilterOption[];
}

export interface HyperlinkAccountFilter {
  filterSchemaVersion: 1 | null;
  countryIso2s: string[] | null;
  excludeCountryIso2s: string[] | null;
  continent: string | null;
  groupIds: number[] | null;
  channelIds: number[] | null;
  protocolId: string | null;
  onlineStatus: "ONLINE" | "OFFLINE" | string | null;
  rotationStatus: number | null;
  accountType: number | null;
  platform: string | null;
  widType: string | null;
  importMode: string | null;
  groupInviteAllowed: boolean | null;
  phone: string | null;
  importBatchId: number | null;
  source: number | null;
  friendCountMin: number | null;
  friendCountMax: number | null;
  retentionDaysMin: number | null;
  retentionDaysMax: number | null;
  registerDaysMin: number | null;
  registerDaysMax: number | null;
  createdAtFrom: number | null;
  createdAtTo: number | null;
}

export interface HyperlinkTaskListItem {
  id: number;
  taskName: string;
  messageType: 1 | 2 | 3 | 4;
  taskMode: HyperlinkTaskMode;
  enabled: boolean;
  runStatus: HyperlinkTaskRunStatus;
  provisionStatus: HyperlinkProvisionStatus;
  shortLinkEnabled: boolean;
  version: number;
  promotionLink: string | null;
  dataPackageId: number | null;
  dataPackageName: string | null;
  accountFilter: HyperlinkAccountFilter;
  targetCountryIso2s: Array<string | null>;
  plannedEndAt: number | null;
  cycleIntervalMinutes: number;
  createdAt: number;
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
}

export interface HyperlinkTaskListQuery {
  page?: number;
  pageSize?: 10 | 20 | 50 | 100 | 200;
  taskName?: string | null;
  runStatus?: HyperlinkTaskRunStatus | null;
  taskMode?: HyperlinkTaskMode | null;
  countryIso2?: string | null;
  createdAtStart?: number | null;
  createdAtEnd?: number | null;
}

export interface HyperlinkTaskMutationReceipt {
  taskId: number;
  provisionStatus: HyperlinkProvisionStatus;
  enabled: boolean;
  runStatus: HyperlinkTaskRunStatus;
  version: number;
  pollAfterMs: number | null;
  failureCode: number | null;
  failureReason: string | null;
}

export interface HyperlinkTaskExportResult {
  blob: Blob;
  filename: string;
  exportedCount: number;
}

function optionalTrimmed(value?: string | null): string | undefined {
  return value?.trim() || undefined;
}

function queryParams(query: HyperlinkTaskListQuery) {
  return {
    page: query.page,
    pageSize: query.pageSize,
    taskName: optionalTrimmed(query.taskName),
    runStatus: query.runStatus ?? undefined,
    taskMode: query.taskMode ?? undefined,
    countryIso2: optionalTrimmed(query.countryIso2)?.toUpperCase(),
    createdAtStart: query.createdAtStart ?? undefined,
    createdAtEnd: query.createdAtEnd ?? undefined
  };
}

function filterParams(query: HyperlinkTaskListQuery) {
  const params = queryParams(query);
  return {
    taskName: params.taskName,
    runStatus: params.runStatus,
    taskMode: params.taskMode,
    countryIso2: params.countryIso2,
    createdAtStart: params.createdAtStart,
    createdAtEnd: params.createdAtEnd
  };
}

export function listHyperlinkTasks(
  query: HyperlinkTaskListQuery = {}
): Promise<PageResult<HyperlinkTaskListItem>> {
  return armadaRequest<PageResult<HyperlinkTaskListItem>>(
    "get",
    "/api/hyperlink-tasks",
    { params: queryParams(query) }
  );
}

export function getHyperlinkTaskCreateContext(): Promise<HyperlinkTaskCreateContext> {
  return armadaRequest<HyperlinkTaskCreateContext>(
    "get",
    "/api/hyperlink-tasks/create-context"
  );
}

export function actionHyperlinkTask(
  id: number,
  action: HyperlinkTaskAction,
  version: number
): Promise<HyperlinkTaskMutationReceipt> {
  return armadaRequest<HyperlinkTaskMutationReceipt>(
    "post",
    `/api/hyperlink-tasks/${id}/action`,
    { data: { action, version, quoteToken: null } }
  );
}

export async function exportHyperlinkTasks(
  query: HyperlinkTaskListQuery = {}
): Promise<HyperlinkTaskExportResult> {
  let filename = "hyperlink-tasks.csv";
  let exportedCount = 0;
  const blob = await http.request<Blob>(
    "get",
    "/api/hyperlink-tasks/export",
    { params: filterParams(query), responseType: "blob" },
    {
      beforeResponseCallback: response => {
        filename =
          filenameFromDisposition(
            headerValue(response.headers, "Content-Disposition")
          ) ?? filename;
        exportedCount = Number(
          headerValue(response.headers, "X-Export-Count") ?? 0
        );
      }
    }
  );
  await rejectJsonBlob(blob);
  return { blob, filename, exportedCount };
}

async function rejectJsonBlob(blob: Blob): Promise<void> {
  if (!blob.type.toLowerCase().includes("json")) return;
  try {
    const payload = JSON.parse(await blob.text()) as { message?: string };
    throw new Error(payload.message ?? "任务列表导出失败");
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error("任务列表导出失败");
    throw error;
  }
}

function headerValue(headers: unknown, name: string): string | undefined {
  if (!headers || typeof headers !== "object") return undefined;
  const entry = Object.entries(headers as Record<string, unknown>).find(
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
