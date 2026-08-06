export interface StandardExecutionStatusInput {
  executionStatus?: number | null;
  stage?: number | null;
  manualPaused?: boolean | null;
  waitResourceType?: number | null;
  reasonCode?: string | null;
}

export const standardStageOptions = [
  { label: "链接校验", value: 1 },
  { label: "管理员进群", value: 2 },
  { label: "管理员设置", value: 3 },
  { label: "管理—拉手联系人", value: 4 },
  { label: "管理员邀请拉手", value: 5 },
  { label: "拉人执行", value: 6 },
  { label: "料子提权", value: 7 },
  { label: "执行收口", value: 8 }
];

const managerAdminReasons = new Set([
  "MANAGER_ADMIN_ACTOR_UNAVAILABLE",
  "MANAGER_ADMIN_SETUP_FAILED",
  "MANAGER_ADMIN_UNCONFIRMED"
]);

export function standardStageLabel(stage?: number | null): string {
  return (
    standardStageOptions.find(option => option.value === stage)?.label ?? "-"
  );
}

export function standardExecutionStatus(
  execution: StandardExecutionStatusInput
): string {
  if (execution.manualPaused) return "PAUSED";
  if (execution.executionStatus === 1) return "WAIT_START";
  if (execution.executionStatus === 2) return "RUNNING";
  if (
    execution.executionStatus === 3 &&
    execution.reasonCode &&
    managerAdminReasons.has(execution.reasonCode)
  ) {
    return "ADMIN_SETUP_FAILED";
  }
  if (execution.executionStatus === 3 && execution.waitResourceType === 1) {
    return "MANAGER_SHORTAGE";
  }
  if (execution.executionStatus === 3 && execution.waitResourceType === 2) {
    return "PULLER_SHORTAGE";
  }
  if (execution.executionStatus === 3 && execution.waitResourceType === 3) {
    return "STATION_SHORTAGE";
  }
  if (execution.executionStatus === 4) return "COMPLETED";
  if (execution.executionStatus === 5) return "GROUP_INVALID";
  if (execution.executionStatus === 6) return "ENDED";
  return "INITIALIZING";
}

export function roleLabel(value: number): string {
  return (
    ({ 1: "管理员", 2: "拉手", 3: "站台", 4: "提权管理员" } as const)[value] ??
    "未知"
  );
}

export function actionTypeLabel(value: number): string {
  return (
    (
      {
        1: "保存联系人",
        2: "邀请入群",
        3: "踩链接入群",
        4: "设置任务管理员"
      } as const
    )[value] ?? "未知"
  );
}
