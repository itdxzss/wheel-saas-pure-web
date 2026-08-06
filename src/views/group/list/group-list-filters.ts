import type { GroupListQuery } from "@/api/group";
import type { IpCountryOption } from "@/api/resource-ip";

export type GroupType = "" | "HISTORICAL" | "POST_CONTROL" | "BOTH";

export interface HistoricalFilterValue {
  continentCode: string;
  countryIso2: string;
  ageDaysMin: number | undefined;
  ageDaysMax: number | undefined;
  memberCountMin: number | undefined;
  memberCountMax: number | undefined;
}

export interface MainGroupFilterValue {
  keyword: string;
  status: string;
  folderFilter: "" | "UNASSIGNED" | number;
  groupType: GroupType;
  availableAdmin: "" | "YES" | "NO";
}

export function emptyHistoricalFilter(): HistoricalFilterValue {
  return {
    continentCode: "",
    countryIso2: "",
    ageDaysMin: undefined,
    ageDaysMax: undefined,
    memberCountMin: undefined,
    memberCountMax: undefined
  };
}

function numberValue(value: number | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function hasHistoricalScope(value: HistoricalFilterValue): boolean {
  return Boolean(
    value.continentCode ||
      value.countryIso2 ||
      numberValue(value.ageDaysMin) != null ||
      numberValue(value.ageDaysMax) != null
  );
}

export function toGroupListQuery(
  main: MainGroupFilterValue,
  applied: HistoricalFilterValue,
  page: number,
  pageSize: number
): GroupListQuery {
  const historicalScope = hasHistoricalScope(applied);
  const groupType = main.groupType || (historicalScope ? "HISTORICAL" : "");
  const sendsHistoricalScope = groupType === "HISTORICAL";
  const query: GroupListQuery = {
    page,
    pageSize,
    keyword: main.keyword.trim() || undefined,
    status: main.status || undefined,
    folderId:
      typeof main.folderFilter === "number" ? main.folderFilter : undefined,
    withoutFolder: main.folderFilter === "UNASSIGNED" || undefined,
    groupType: groupType || undefined,
    availableAdmin:
      main.availableAdmin === "YES"
        ? true
        : main.availableAdmin === "NO"
          ? false
          : undefined,
    memberCountMin: numberValue(applied.memberCountMin),
    memberCountMax: numberValue(applied.memberCountMax)
  };
  if (sendsHistoricalScope) {
    query.continentCode = applied.continentCode || undefined;
    query.countryIso2 = applied.countryIso2 || undefined;
    query.ageDaysMin = numberValue(applied.ageDaysMin);
    query.ageDaysMax = numberValue(applied.ageDaysMax);
  }
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined)
  ) as GroupListQuery;
}

export function countriesForContinent(
  rows: IpCountryOption[],
  continentCode: string
): IpCountryOption[] {
  const realCountries = rows.filter(row => !row.virtual && row.iso2);
  if (!continentCode) return realCountries;
  return realCountries.filter(row => row.continentCode === continentCode);
}
