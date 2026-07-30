import type { ThresholdMode } from "./create-draft";

export const GROUP_PULL_MARKETING_LIST_PATH = "/task/group-pull-marketing";

export interface TargetFileLike {
  name: string;
}

export interface TargetFileSelection<T extends TargetFileLike> {
  file: T | null;
  warning: string | null;
}

export function reconcileSelectedGroupIds(
  previousIds: number[],
  currentPageIds: number[],
  currentPageSelectedIds: number[]
): number[] {
  const currentPageIdSet = new Set(currentPageIds);
  const retainedIds = previousIds.filter(id => !currentPageIdSet.has(id));
  return [...new Set([...retainedIds, ...currentPageSelectedIds])];
}

export function thresholdMaximum(mode: ThresholdMode): number | undefined {
  return mode === "RATE" ? 100 : undefined;
}

export function normalizeThreshold(value: number, mode: ThresholdMode): number {
  const nonNegativeValue = Math.max(0, value);
  return mode === "RATE" ? Math.min(100, nonNegativeValue) : nonNegativeValue;
}

export function resolveTargetFileSelection<T extends TargetFileLike>(
  previousFile: T | null,
  candidateFile: T | null
): TargetFileSelection<T> {
  if (!candidateFile) return { file: previousFile, warning: null };
  if (!candidateFile.name.trim().toLowerCase().endsWith(".txt")) {
    return { file: previousFile, warning: "仅支持 TXT 文件" };
  }
  return { file: candidateFile, warning: null };
}

export function notifyUnconfirmedCreateAction(
  action: string,
  notify: (message: string) => void
): void {
  notify(`${action}接口契约待确认，当前仅完成前端配置`);
}
