import type { TenantAccount } from "../../../api/account";

export interface WsPhoneExportSelectionAnalysis {
  ids: number[];
  normalCount: number;
  abnormalCount: number;
  invalidIdCount: number;
  groupName?: string;
  previewFilename: string;
}

function shanghaiDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function safeFilenameGroup(groupName: string): string {
  return groupName.trim().replace(/[\u0000-\u001f\u007f<>:"/\\|?*]/g, "_");
}

export function analyzeWsPhoneExportSelection(
  rows: TenantAccount[],
  now = new Date()
): WsPhoneExportSelectionAnalysis {
  const ids = rows
    .map(row => row.id)
    .filter((id): id is number => Number.isSafeInteger(id));
  const normalCount = rows.filter(row => row.account_state === 2).length;
  const groupNames = rows.map(row => row.group_name?.trim() ?? "");
  const firstGroupName = groupNames[0] ?? "";
  const groupName =
    firstGroupName && groupNames.every(name => name === firstGroupName)
      ? firstGroupName
      : undefined;
  const filenameGroup = groupName
    ? safeFilenameGroup(groupName) || "全部WS号"
    : "全部WS号";

  return {
    ids,
    normalCount,
    abnormalCount: rows.length - normalCount,
    invalidIdCount: rows.length - ids.length,
    groupName,
    previewFilename: `${filenameGroup}_${shanghaiDate(now)}.txt`
  };
}
