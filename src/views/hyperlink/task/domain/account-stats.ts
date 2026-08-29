import type {
  HyperlinkAccountStatFilter,
  HyperlinkAccountStatSortField,
  HyperlinkSortOrder
} from "@/api/hyperlink-task-account-stats";

export interface AccountStatSearchForm {
  timeRange: [number, number] | [];
  senderCountryIso2: string;
  successRateMin?: number;
  successRateMax?: number;
}

export const DEFAULT_ACCOUNT_STAT_SORT: Readonly<{
  sortField: HyperlinkAccountStatSortField;
  sortOrder: HyperlinkSortOrder;
}> = { sortField: "successNum", sortOrder: "desc" };

export function emptyAccountStatSearchForm(): AccountStatSearchForm {
  return {
    timeRange: [],
    senderCountryIso2: "",
    successRateMin: undefined,
    successRateMax: undefined
  };
}

export function validateAccountStatSearch(
  form: AccountStatSearchForm
): string | null {
  const { successRateMin: minimum, successRateMax: maximum } = form;
  if (
    minimum != null &&
    (!Number.isFinite(minimum) || minimum < 0 || minimum > 100)
  ) {
    return "成功率最小值必须在 0 到 100 之间";
  }
  if (
    maximum != null &&
    (!Number.isFinite(maximum) || maximum < 0 || maximum > 100)
  ) {
    return "成功率最大值必须在 0 到 100 之间";
  }
  if (minimum != null && maximum != null && minimum > maximum) {
    return "成功率最小值不能大于最大值";
  }
  if (form.timeRange.length === 2 && form.timeRange[0] >= form.timeRange[1]) {
    return "开始时间必须早于结束时间";
  }
  return null;
}

export function toAccountStatFilter(
  form: AccountStatSearchForm,
  sortField: HyperlinkAccountStatSortField,
  sortOrder: HyperlinkSortOrder
): HyperlinkAccountStatFilter {
  const filter: HyperlinkAccountStatFilter = { sortField, sortOrder };
  if (form.timeRange.length === 2) {
    filter.startAt = form.timeRange[0];
    filter.endAt = form.timeRange[1];
  }
  const country = form.senderCountryIso2.trim().toUpperCase();
  if (country) filter.senderCountryIso2 = country;
  if (form.successRateMin != null) filter.successRateMin = form.successRateMin;
  if (form.successRateMax != null) filter.successRateMax = form.successRateMax;
  return filter;
}

export function normalizedAccountStatSort(
  prop?: string | null,
  order?: string | null
): { sortField: HyperlinkAccountStatSortField; sortOrder: HyperlinkSortOrder } {
  const fields: HyperlinkAccountStatSortField[] = [
    "successNum",
    "deliveredNum",
    "failedNum"
  ];
  if (!fields.includes(prop as HyperlinkAccountStatSortField) || !order) {
    return { ...DEFAULT_ACCOUNT_STAT_SORT };
  }
  return {
    sortField: prop as HyperlinkAccountStatSortField,
    sortOrder: order === "ascending" ? "asc" : "desc"
  };
}
