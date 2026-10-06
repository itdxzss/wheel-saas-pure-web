export interface CreatorDeletionProgress {
  stage?: number | null;
  creatorDeletionStatus?: string | null;
  creatorDeletionReason?: string | null;
  creatorDeletionOperationId?: string | null;
}

const deletionLabels: Record<string, string> = {
  RESERVED: "等待管理员接管",
  COMPLETE: "注销及创建者清理完成",
  PREPARED: "注销中（已登记操作）",
  SUBMITTED: "注销中（等待结果）",
  DELETING: "注销中",
  ACCEPTED: "等待创建者清理",
  VERIFYING: "等待创建者清理",
  WAITING_CLEANUP: "等待创建者清理",
  COMPLETED: "注销及创建者清理完成",
  FAILED: "注销失败",
  UNKNOWN: "注销结果未知"
};

export function creatorDeletionLabel(
  progress: CreatorDeletionProgress
): string {
  const status = progress.creatorDeletionStatus;
  if (status) return deletionLabels[status] ?? `注销状态待核实（${status}）`;
  if (progress.stage === 11) return "注销中";
  if (progress.stage === 12) return "等待创建者清理";
  return "";
}

export function canEditCreatorDeletion(
  status: string | null | undefined,
  startedAt: number | null | undefined
): boolean {
  return status === "WAIT_START" && startedAt === null;
}
