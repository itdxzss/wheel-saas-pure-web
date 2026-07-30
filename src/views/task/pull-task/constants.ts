import type { PullTaskGroupStatus, PullTaskStatus } from "@/api/pull-task";
import { formatEpochMillis } from "@/utils/time";

export const pullTaskStatusOptions: Array<{
  label: string;
  value: PullTaskStatus;
}> = [
  { label: "待启动", value: "WAIT_START" },
  { label: "进行中", value: "EXECUTING" },
  { label: "暂停中", value: "PAUSED" },
  { label: "已中断", value: "INTERRUPTED" },
  { label: "已完成", value: "COMPLETED" },
  { label: "任务已结束", value: "ENDED" }
];

export const groupRowStatusOptions: Array<{
  label: string;
  value: PullTaskGroupStatus;
}> = [
  { label: "任务待启动", value: "WAIT_START" },
  { label: "初始化", value: "INITIALIZING" },
  { label: "添加执行中", value: "RUNNING" },
  { label: "群组封禁", value: "GROUP_BANNED" },
  { label: "拉手不足", value: "PULLER_SHORTAGE" },
  { label: "任务暂停", value: "PAUSED" },
  { label: "建群失败", value: "GROUP_CREATE_FAILED" },
  { label: "任务完成", value: "COMPLETED" },
  { label: "任务已结束", value: "ENDED" },
  { label: "管理员无法设置", value: "ADMIN_SETUP_FAILED" }
];

export const pullTaskColumns: TableColumnList = [
  { label: "任务信息", prop: "taskName", minWidth: 260 },
  { label: "任务状态", prop: "status", minWidth: 180 },
  { label: "群组处理进度", prop: "processedGroupCount", minWidth: 190 },
  { label: "拉人结果", prop: "joinedSuccessCount", minWidth: 190 },
  {
    label: "营销进度",
    prop: "marketingRunningGroupCount",
    minWidth: 150
  },
  { label: "消息发送", prop: "messageSuccessCount", minWidth: 170 },
  { label: "异常情况", prop: "abnormalGroupCount", minWidth: 180 },
  { label: "剩余资源", prop: "remainingTargetCount", minWidth: 220 },
  { label: "时间", prop: "lastExecutedAt", minWidth: 190 },
  { label: "操作", prop: "id", minWidth: 230 }
];

export function pullTaskStatusLabel(
  status?: PullTaskStatus | string | null
): string {
  return (
    pullTaskStatusOptions.find(option => option.value === status)?.label ?? "-"
  );
}

export function pullTaskStatusTagType(status?: PullTaskStatus | string | null) {
  if (status === "EXECUTING") return "primary";
  if (status === "COMPLETED") return "success";
  if (status === "INTERRUPTED") return "danger";
  if (status === "PAUSED") return "warning";
  return "info";
}

export function groupRowStatusLabel(
  status?: PullTaskGroupStatus | string | null
): string {
  return (
    groupRowStatusOptions.find(option => option.value === status)?.label ?? "-"
  );
}

export function groupRowStatusTagType(
  status?: PullTaskGroupStatus | string | null
) {
  if (status === "COMPLETED") return "success";
  if (
    status === "GROUP_BANNED" ||
    status === "GROUP_CREATE_FAILED" ||
    status === "ADMIN_SETUP_FAILED" ||
    status === "GROUP_INVALID" ||
    status === "ENDED"
  ) {
    return "danger";
  }
  if (status === "PULLER_SHORTAGE" || status === "PAUSED") return "warning";
  if (status === "RUNNING" || status === "INITIALIZING") return "primary";
  return "info";
}

export function pullTaskModeLabel(mode?: string | null): string {
  if (mode === "OLD_LINK") return "老群链接";
  if (mode === "CREATE_NEW") return "自建群";
  return mode || "-";
}

export function formatEpoch(value?: number | null): string {
  return formatEpochMillis(value);
}
