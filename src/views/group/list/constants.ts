export const groupStatusOptions = [
  { label: "全部状态", value: "" },
  { label: "未检测", value: "UNCHECKED" },
  { label: "可用", value: "AVAILABLE" },
  { label: "封禁", value: "BANNED" },
  { label: "链接失效", value: "LINK_INVALID" },
  { label: "不可用", value: "UNAVAILABLE" }
];

export const groupTypeOptions = [
  { label: "全部群组", value: "" },
  { label: "历史群", value: "HISTORICAL" },
  { label: "上控后群", value: "POST_CONTROL" },
  { label: "同时属于两类", value: "BOTH" }
];

export const availableAdminOptions = [
  { label: "全部", value: "" },
  { label: "有可用管理员", value: "YES" },
  { label: "无可用管理员", value: "NO" }
];

export const groupOriginOptions: Array<{ label: string; value: "" | number }> =
  [
    { label: "全部来源", value: "" },
    { label: "导入链接", value: 1 },
    { label: "进群任务", value: 2 },
    { label: "拉群任务", value: 3 },
    { label: "自建群", value: 4 }
  ];

export const membershipStateOptions: Array<{
  label: string;
  value: "" | number;
}> = [
  { label: "全部关系", value: "" },
  { label: "目标未进群", value: 1 },
  { label: "已进群", value: 2 },
  { label: "自建拥有", value: 3 }
];

export const timedMessageOptions: Array<{
  label: string;
  value: TimedMessageMode;
}> = [
  { label: "24小时", value: "24h" },
  { label: "7天", value: "7d" },
  { label: "90天", value: "90d" },
  { label: "关闭", value: "off" }
];

export const groupListColumns: TableColumnList = [
  { label: "WS 群名称", prop: "groupName", minWidth: 230 },
  { label: "群组分组", prop: "folderName", minWidth: 130 },
  { label: "成员数", prop: "memberCount", width: 100 },
  { label: "邀请链接", prop: "inviteUrl", minWidth: 240 },
  { label: "全部管理员号码", prop: "adminPhones", minWidth: 190 },
  { label: "状态", prop: "status", width: 110 },
  { label: "可用管理员", prop: "availableAdmin", width: 120 },
  { label: "创建信息", prop: "groupCreatedAt", minWidth: 250 },
  { label: "群 JID", prop: "groupJid", minWidth: 210 },
  { label: "操作", prop: "operation", fixed: "right", width: 220 }
];
import type { TimedMessageMode } from "@/api/group";
