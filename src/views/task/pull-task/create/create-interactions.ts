import type {
  PullTaskMarketingCreateDraft,
  ThresholdMode
} from "./create-draft";

export const PULL_TASK_LIST_ROUTE_NAME = "TaskPull";

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
  notify(action + "接口契约待确认，当前仅完成前端配置");
}

export function validateCreateDraft(
  draft: PullTaskMarketingCreateDraft
): string[] {
  const errors: string[] = [];
  if (!draft.taskName.trim()) errors.push("请填写任务名称");
  if (!draft.targetPackageId && !draft.targetFile) {
    errors.push("请选择目标数据包或上传 TXT");
  }
  if (draft.selectedGroupIds.length === 0) {
    errors.push("请选择至少一个目标群组");
  }
  if (!draft.marketingTemplateId) errors.push("请选择营销模板");
  if (draft.groupNameMode === "UNIFIED" && !draft.unifiedGroupName.trim()) {
    errors.push("请填写统一群名称");
  }
  if (
    draft.groupNameMode === "TEMPLATE_SEQUENCE" &&
    !draft.groupNameTemplate.trim()
  ) {
    errors.push("请填写群名称模板");
  }
  if (
    draft.groupDescriptionMode === "UNIFIED" &&
    !draft.unifiedGroupDescription.trim()
  ) {
    errors.push("请填写统一群描述");
  }
  if (draft.startMode === "SCHEDULED" && !draft.scheduledAt) {
    errors.push("请选择定时启动时间");
  }
  return errors;
}
