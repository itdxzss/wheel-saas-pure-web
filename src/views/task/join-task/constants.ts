import type {
  JoinResultStatus,
  JoinTaskDistributionMode,
  JoinTaskStatus
} from "@/api/join-task";
import { formatEpochMillis } from "@/utils/time";

export type JoinFailurePolicy =
  | "RETRY_ONLY"
  | "RETRY_THEN_EXPORT"
  | "SKIP_AND_CONTINUE"
  | "STOP_ON_THRESHOLD"
  | (string & {});

export const joinTaskStatusOptions: Array<{
  label: string;
  value: JoinTaskStatus;
}> = [
  { label: "待启动", value: "DRAFT" },
  { label: "进行中", value: "RUNNING" },
  { label: "暂停中", value: "PAUSED" },
  { label: "已停止", value: "STOPPED" },
  { label: "已完成", value: "DONE" },
  { label: "异常", value: "FAILED" }
];

export const joinTaskDistributionOptions: Array<{
  label: string;
  value: JoinTaskDistributionMode;
  description: string;
}> = [
  {
    label: "每条链接固定账号数",
    value: "FIXED_ACCOUNTS_PER_LINK",
    description: "按每条群链接分配固定数量账号，生成链接数 x 账号数计划。"
  },
  {
    label: "固定账号执行多链接",
    value: "FIXED_ACCOUNT_MULTI_LINK",
    description: "指定执行账号数量，每个账号按配置进入多条群链接。"
  }
];

export const failurePolicyOptions: Array<{
  label: string;
  value: JoinFailurePolicy;
}> = [
  { label: "仅重试", value: "RETRY_ONLY" },
  { label: "重试后导出失败", value: "RETRY_THEN_EXPORT" },
  { label: "跳过继续", value: "SKIP_AND_CONTINUE" },
  { label: "失败阈值停止", value: "STOP_ON_THRESHOLD" }
];

export const joinTaskColumns: TableColumnList = [
  { label: "ID", prop: "id", width: 90 },
  { label: "任务名称", prop: "name", minWidth: 220 },
  { label: "账号分组", prop: "accountGroupNames", minWidth: 180 },
  { label: "分配方式", prop: "distributionMode", width: 170 },
  { label: "进群统计", prop: "total", width: 150 },
  { label: "进群间隔", prop: "intervalLabel", width: 120 },
  { label: "重试", prop: "retryEnabled", width: 110 },
  { label: "任务状态", prop: "status", width: 120 },
  { label: "创建时间", prop: "createdAt", width: 180 }
];

export function joinTaskStatusLabel(status?: JoinTaskStatus | null): string {
  return (
    joinTaskStatusOptions.find(option => option.value === status)?.label ??
    status ??
    "-"
  );
}

export function joinTaskStatusTagType(status?: JoinTaskStatus | null) {
  if (status === "RUNNING") return "primary";
  if (status === "DONE") return "success";
  if (status === "FAILED") return "danger";
  if (status === "DRAFT" || status === "PAUSED") return "warning";
  return "info";
}

export function joinTaskDistributionLabel(
  mode?: JoinTaskDistributionMode | null
): string {
  return (
    joinTaskDistributionOptions.find(option => option.value === mode)?.label ??
    mode ??
    "-"
  );
}

export function failurePolicyLabel(policy?: string | null): string {
  return (
    failurePolicyOptions.find(option => option.value === policy)?.label ??
    policy ??
    "-"
  );
}

export function joinResultStatusLabel(
  status?: JoinResultStatus | null
): string {
  if (status === "PENDING") return "待执行";
  if (status === "SUCCESS") return "成功";
  if (status === "FAILED") return "失败";
  return status ?? "-";
}

export function joinResultStatusTagType(status?: JoinResultStatus | null) {
  if (status === "SUCCESS") return "success";
  if (status === "FAILED") return "danger";
  if (status === "PENDING") return "info";
  return "info";
}

export function formatEpoch(value?: number | null): string {
  return formatEpochMillis(value);
}
