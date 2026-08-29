import type {
  FeedTaskAccountFilter,
  FeedTaskRow,
  FeedTaskStatus
} from "@/api/feed-task";

export const feedTaskStatusOptions: Array<{
  label: string;
  value: FeedTaskStatus;
}> = [
  { label: "未开始", value: 0 },
  { label: "进行中", value: 1 },
  { label: "已完成", value: 2 },
  { label: "已暂停", value: 3 },
  { label: "已停止", value: 4 }
];

export const feedTaskAccountTypeOptions = [
  { label: "个人号", value: 1 },
  { label: "商业号", value: 2 }
];

export const feedTaskAccountStateOptions = [
  { label: "正常", value: 2 },
  { label: "账号受限", value: 8 },
  { label: "封禁", value: 3 },
  { label: "导出", value: 4 },
  { label: "解绑", value: 5 },
  { label: "被抢登", value: 6 },
  { label: "抢登中", value: 7 }
];

export const feedTaskLoginStateOptions = [
  { label: "在线", value: 1 },
  { label: "离线", value: 2 },
  { label: "待上线", value: 3 }
];

export const feedTaskSourceOptions = [
  { label: "买量", value: 1 },
  { label: "裂变", value: 2 },
  { label: "自购", value: 3 }
];

export const feedTaskThemeOptions = [
  { name: "深绿", backgroundColor: "#075E54", textColor: "#FFFFFF" },
  { name: "WA 绿", backgroundColor: "#25D366", textColor: "#FFFFFF" },
  { name: "蓝", backgroundColor: "#34B7F1", textColor: "#FFFFFF" },
  { name: "紫", backgroundColor: "#9B59B6", textColor: "#FFFFFF" },
  { name: "橙", backgroundColor: "#FFAE42", textColor: "#1F1F1F" },
  { name: "红", backgroundColor: "#FF6B6B", textColor: "#FFFFFF" },
  { name: "深灰", backgroundColor: "#1F2C33", textColor: "#FFFFFF" },
  { name: "米白", backgroundColor: "#F5F1E8", textColor: "#1F1F1F" }
];

export const feedTaskColumns: TableColumnList = [
  { label: "ID", prop: "id", width: 80 },
  { label: "动态 / 推广标题", prop: "title", minWidth: 270 },
  { label: "状态", prop: "taskStatus", width: 110 },
  { label: "进度（成功 / 失败 / 总数）", prop: "progress", width: 210 },
  { label: "账号范围", prop: "accountFilter", minWidth: 220 },
  { label: "使用号数", prop: "totalAccountNum", width: 100 },
  { label: "曝光人数", prop: "exposure", width: 100 },
  { label: "号均曝光量", prop: "avgExposure", width: 110 },
  { label: "计划开始时间", prop: "taskStartAt", width: 170 },
  { label: "计划结束时间", prop: "taskPlannedEndAt", width: 170 }
];

export interface FeedTaskForm {
  name: string;
  accountFilter: FeedTaskAccountFilter;
  title: string;
  description: string;
  content: string;
  promotionLink: string;
  textColor: string;
  backgroundColor: string;
  concurrency: number;
  retryMax: number;
  startMode: "now" | "scheduled";
  taskDelayMinutes: number;
  taskMode: "instant" | "rolling";
  taskPlannedEndAt: number | string | null;
  status: 0 | 1;
}

export function emptyFeedTaskForm(): FeedTaskForm {
  return {
    name: "",
    accountFilter: {},
    title: "",
    description: "",
    content: "",
    promotionLink: "",
    textColor: "#FFFFFF",
    backgroundColor: "#075E54",
    concurrency: 10,
    retryMax: 3,
    startMode: "now",
    taskDelayMinutes: 0,
    taskMode: "instant",
    taskPlannedEndAt: null,
    status: 1
  };
}

export function taskStatusLabel(
  row: Pick<FeedTaskRow, "status" | "taskStatus">
): string {
  if (row.status === 0) return "已停用";
  return (
    feedTaskStatusOptions.find(option => option.value === row.taskStatus)
      ?.label ?? "-"
  );
}

export function taskStatusType(
  row: Pick<FeedTaskRow, "status" | "taskStatus">
): "success" | "info" | "warning" | "danger" | "" {
  if (row.status === 0 || row.taskStatus === 0) return "";
  if (row.taskStatus === 1) return "info";
  if (row.taskStatus === 2) return "success";
  if (row.taskStatus === 3) return "warning";
  return "danger";
}

export function formatFeedTaskTime(value?: string | null): string {
  return value ? value.slice(0, 19).replace("T", " ") : "-";
}

export function accountFilterSummary(filter: FeedTaskAccountFilter): string {
  const values: string[] = [];
  if (filter.country) values.push(`国家:${filter.country}`);
  if (filter.accountGroupId) values.push(`分组 #${filter.accountGroupId}`);
  if (filter.accountType) {
    values.push(filter.accountType === 1 ? "个人号" : "商业号");
  }
  if (filter.loginState) {
    values.push(
      feedTaskLoginStateOptions.find(
        item => item.value === filter.loginState
      )?.label ?? ""
    );
  }
  if (filter.accountState) {
    values.push(
      feedTaskAccountStateOptions.find(
        item => item.value === filter.accountState
      )?.label ?? ""
    );
  }
  if (filter.phone) values.push(`手机号:${filter.phone}`);
  if (filter.protocolId) values.push(`协议:${filter.protocolId}`);
  if (filter.channelName) values.push(`渠道:${filter.channelName}`);
  if (filter.keyword) values.push(`关键词:${filter.keyword}`);
  if (filter.callable === true) values.push("可发送");
  if (filter.callable === false) values.push("不可发送");
  return values.length ? values.join("、") : "不限（全部有效账号）";
}
