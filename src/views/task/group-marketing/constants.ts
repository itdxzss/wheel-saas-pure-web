import type {
  MarketingTaskStatus,
  MarketingTaskTargetStatus
} from "@/api/marketing-task";
import { formatEpochMillis } from "@/utils/time";

export const taskStatusOptions: Array<{
  label: string;
  value: MarketingTaskStatus;
}> = [
  { label: "待启动", value: 1 },
  { label: "发送中", value: 2 },
  { label: "发送成功", value: 3 },
  { label: "发送失败", value: 4 },
  { label: "已停止", value: 5 },
  { label: "部分失败", value: 6 }
];

export const taskColumns: TableColumnList = [
  { label: "ID", prop: "id", width: 90 },
  { label: "任务名称", prop: "taskName", minWidth: 220 },
  { label: "营销账号在线数量", prop: "selectedAccountCount", width: 150 },
  { label: "营销账号封禁/禁言", prop: "failedMessageCount", width: 150 },
  { label: "营销群组数量", prop: "targetGroupCount", width: 130 },
  { label: "发送条数", prop: "sentMessageCount", width: 110 },
  { label: "发送状态", prop: "status", width: 120 },
  { label: "最后发送时间", prop: "lastSentAt", width: 180 }
];

export function taskStatusLabel(status?: MarketingTaskStatus | null): string {
  return (
    taskStatusOptions.find(option => option.value === status)?.label ?? "-"
  );
}

export function taskStatusTagType(status?: MarketingTaskStatus | null) {
  if (status === 2) return "primary";
  if (status === 3) return "success";
  if (status === 4) return "danger";
  if (status === 5) return "warning";
  if (status === 6) return "warning";
  return "info";
}

export function targetStatusLabel(
  status?: MarketingTaskTargetStatus | null
): string {
  if (status === 1) return "待发送";
  if (status === 2) return "发送中";
  if (status === 3) return "成功";
  if (status === 4) return "失败";
  if (status === 5) return "部分失败";
  if (status === 6) return "已跳过";
  if (status === 7) return "已停止";
  return "-";
}

export function targetStatusTagType(status?: MarketingTaskTargetStatus | null) {
  if (status === 3) return "success";
  if (status === 4) return "danger";
  if (status === 5 || status === 6) return "warning";
  if (status === 2) return "primary";
  return "info";
}

export function formatEpoch(value?: number | null): string {
  return formatEpochMillis(value);
}
