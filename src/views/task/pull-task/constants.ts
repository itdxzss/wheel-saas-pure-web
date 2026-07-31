import type {
  PullTaskGroupSource,
  PullTaskGroupStatus,
  PullTaskStatus,
  PullTaskType
} from "@/api/pull-task";
import { formatEpochMillis } from "@/utils/time";

export const pullTaskStatusOptions: Array<{
  label: string;
  value: PullTaskStatus;
}> = [
  { label: "草稿", value: "DRAFT" },
  { label: "待开始", value: "WAIT_START" },
  { label: "校验中", value: "VALIDATING" },
  { label: "等待资源", value: "WAITING_RESOURCE" },
  { label: "执行中", value: "EXECUTING" },
  { label: "部分完成", value: "PARTIAL_COMPLETED" },
  { label: "已暂停", value: "PAUSED" },
  { label: "已停止", value: "STOPPED" },
  { label: "已完成", value: "COMPLETED" },
  { label: "执行失败", value: "FAILED" },
  { label: "已中断", value: "INTERRUPTED" },
  { label: "任务已结束", value: "ENDED" }
];

export const pullTaskTypeOptions: Array<{
  label: string;
  value: PullTaskType;
}> = [
  { label: "普通拉群", value: "STANDARD" },
  { label: "拉群营销", value: "GROUP_MARKETING" }
];

export const pullTaskGroupSourceOptions: Array<{
  label: string;
  value: PullTaskGroupSource;
}> = [
  { label: "历史老群", value: "HISTORICAL" },
  { label: "自收群", value: "SELF_COLLECTED" },
  { label: "混合来源", value: "MIXED" }
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
  { label: "群组处理进度", prop: "groupProgress", minWidth: 190 },
  { label: "拉人结果", prop: "pullResult", minWidth: 190 },
  {
    label: "营销进度",
    prop: "marketingProgress",
    minWidth: 150
  },
  { label: "消息发送", prop: "messageStats", minWidth: 170 },
  { label: "异常情况", prop: "exceptionStats", minWidth: 180 },
  { label: "剩余资源", prop: "resourceStats", minWidth: 220 },
  { label: "时间/操作", prop: "lastExecutedAt", minWidth: 230 }
];

const standardStatusLabels: Partial<Record<PullTaskStatus, string>> = {
  WAIT_START: "待启动",
  EXECUTING: "进行中",
  PAUSED: "暂停中",
  INTERRUPTED: "已中断",
  COMPLETED: "已完成",
  ENDED: "任务已结束"
};

const marketingStatusLabels: Partial<Record<PullTaskStatus, string>> = {
  DRAFT: "草稿",
  WAIT_START: "待开始",
  VALIDATING: "校验中",
  WAITING_RESOURCE: "等待资源",
  EXECUTING: "执行中",
  PARTIAL_COMPLETED: "部分完成",
  PAUSED: "已暂停",
  STOPPED: "已停止",
  COMPLETED: "已完成",
  FAILED: "执行失败"
};

export function pullTaskStatusLabel(
  status?: PullTaskStatus | string | null,
  taskType: PullTaskType = "STANDARD"
): string {
  if (!status) return "-";
  const labels =
    taskType === "GROUP_MARKETING"
      ? marketingStatusLabels
      : standardStatusLabels;
  return labels[status as PullTaskStatus] ?? "-";
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
