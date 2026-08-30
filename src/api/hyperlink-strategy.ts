import { armadaRequest } from "@/api/armada";
import type {
  HyperlinkAccountFilter,
  HyperlinkAccountMatchCount,
  HyperlinkFilterOption,
  HyperlinkTaskMode
} from "@/api/hyperlink-task";

export interface PageResult<T> {
  list: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface HyperlinkStrategyQuery {
  page?: number;
  pageSize?: 10 | 20 | 50 | 100;
  name?: string;
  taskMode?: HyperlinkTaskMode;
  enabled?: boolean;
}

export interface HyperlinkStrategyPayload {
  name: string;
  taskMode: HyperlinkTaskMode;
  accountFilter: HyperlinkAccountFilter;
  maxExecutingAccounts: number;
  maxUseAccounts: number;
  maxSendPerAccount: number;
  cycleIntervalMinutes: number;
  enabled: boolean;
}

export interface HyperlinkStrategyUpdatePayload
  extends HyperlinkStrategyPayload {
  version: number;
}

export interface HyperlinkStrategyListItem extends HyperlinkStrategyPayload {
  id: number;
  version: number;
  createdBy: number | null;
  createdAt: number | string;
  updatedAt: number | string;
}

export type HyperlinkStrategyDetail = HyperlinkStrategyListItem;

/** Enabled strategies returned to the task editor as weak-copy presets. */
export interface HyperlinkStrategyOptionRow {
  id: number;
  name: string;
  taskMode: HyperlinkTaskMode;
  accountFilter: HyperlinkAccountFilter;
  maxExecutingAccounts: number;
  maxUseAccounts: number;
  maxSendPerAccount: number;
  cycleIntervalMinutes: number;
}

export interface HyperlinkStrategyAccountContext {
  defaultAccountGroupIds: number[];
  groupOptions: HyperlinkFilterOption[];
  countryOptions: HyperlinkFilterOption[];
  channelOptions: HyperlinkFilterOption[];
  protocolOptions: HyperlinkFilterOption[];
}

function optionalTrimmed(value?: string): string | undefined {
  return value?.trim() || undefined;
}

export function listHyperlinkStrategies(
  query: HyperlinkStrategyQuery = {}
): Promise<PageResult<HyperlinkStrategyListItem>> {
  return armadaRequest<PageResult<HyperlinkStrategyListItem>>(
    "get",
    "/api/hyperlink-strategies",
    {
      params: {
        page: query.page,
        pageSize: query.pageSize,
        name: optionalTrimmed(query.name),
        taskMode: query.taskMode,
        enabled: query.enabled
      }
    }
  );
}

export function getHyperlinkStrategy(
  id: number
): Promise<HyperlinkStrategyDetail> {
  return armadaRequest<HyperlinkStrategyDetail>(
    "get",
    `/api/hyperlink-strategies/${id}`
  );
}

export function createHyperlinkStrategy(
  data: HyperlinkStrategyPayload
): Promise<HyperlinkStrategyDetail> {
  return armadaRequest<HyperlinkStrategyDetail>(
    "post",
    "/api/hyperlink-strategies",
    { data }
  );
}

export function updateHyperlinkStrategy(
  id: number,
  data: HyperlinkStrategyUpdatePayload
): Promise<HyperlinkStrategyDetail> {
  return armadaRequest<HyperlinkStrategyDetail>(
    "put",
    `/api/hyperlink-strategies/${id}`,
    { data }
  );
}

export function deleteHyperlinkStrategy(id: number): Promise<void> {
  return armadaRequest<void>("delete", `/api/hyperlink-strategies/${id}`);
}

export function listHyperlinkStrategyOptionRows(
  keyword?: string,
  limit = 50
): Promise<HyperlinkStrategyOptionRow[]> {
  return armadaRequest<HyperlinkStrategyOptionRow[]>(
    "get",
    "/api/hyperlink-strategies/options",
    { params: { keyword: optionalTrimmed(keyword), limit } }
  );
}

export function getHyperlinkStrategyAccountContext(): Promise<HyperlinkStrategyAccountContext> {
  return armadaRequest<HyperlinkStrategyAccountContext>(
    "get",
    "/api/hyperlink-strategies/account-context"
  );
}

export function countHyperlinkStrategyAccounts(
  accountFilter: HyperlinkAccountFilter,
  signal?: AbortSignal
): Promise<HyperlinkAccountMatchCount> {
  return armadaRequest<HyperlinkAccountMatchCount>(
    "post",
    "/api/hyperlink-strategies/account-match-count",
    { data: accountFilter, signal }
  );
}
