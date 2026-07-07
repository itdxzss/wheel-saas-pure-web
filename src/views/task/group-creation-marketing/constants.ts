import type {
  GroupCreationMarketingItemStatus,
  GroupCreationMarketingTaskStatus
} from "@/api/group-creation-marketing";
import { formatEpochMillis } from "@/utils/time";

export const taskStatusOptions: Array<{
  label: string;
  value: GroupCreationMarketingTaskStatus;
}> = [
  { label: "待执行", value: 1 },
  { label: "执行中", value: 2 },
  { label: "成功", value: 3 },
  { label: "失败", value: 4 },
  { label: "部分失败", value: 5 },
  { label: "已停止", value: 6 }
];

export const taskColumns: TableColumnList = [
  { label: "ID", prop: "id", width: 90 },
  { label: "任务名称", prop: "taskName", minWidth: 220 },
  { label: "账号分组", prop: "accountGroupName", minWidth: 160 },
  { label: "营销模板", prop: "marketingTemplateName", minWidth: 160 },
  { label: "匹配文件", prop: "matchedItemCount", width: 140 },
  { label: "执行结果", prop: "successCount", width: 180 },
  { label: "任务状态", prop: "status", width: 120 },
  { label: "创建时间", prop: "createdAt", width: 180 }
];

export const GROUP_CREATION_MARKETING_STATUS_TEXT: Record<number, string> = {
  1: "待执行",
  2: "执行中",
  3: "成功",
  4: "失败",
  5: "部分失败",
  6: "已停止"
};

export const GROUP_CREATION_MARKETING_ITEM_STATUS_TEXT: Record<number, string> =
  {
    1: "待执行",
    2: "建群中",
    3: "营销发送中",
    4: "成功",
    5: "失败",
    6: "放弃"
  };

export function taskStatusLabel(
  status?: GroupCreationMarketingTaskStatus | null
): string {
  return GROUP_CREATION_MARKETING_STATUS_TEXT[Number(status)] ?? "-";
}

export function taskStatusTagType(
  status?: GroupCreationMarketingTaskStatus | null
) {
  if (status === 2) return "primary";
  if (status === 3) return "success";
  if (status === 4) return "danger";
  if (status === 5) return "warning";
  if (status === 6) return "warning";
  return "info";
}

export function itemStatusLabel(
  status?: GroupCreationMarketingItemStatus | null
): string {
  return GROUP_CREATION_MARKETING_ITEM_STATUS_TEXT[Number(status)] ?? "-";
}

export function itemStatusTagType(
  status?: GroupCreationMarketingItemStatus | null
) {
  if (status === 4) return "success";
  if (status === 5) return "danger";
  if (status === 6) return "warning";
  if (status === 2 || status === 3) return "primary";
  return "info";
}

export function formatEpoch(value?: number | null): string {
  return formatEpochMillis(value);
}
