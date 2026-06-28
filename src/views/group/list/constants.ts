export const groupStatusOptions = [
  { label: "全部状态", value: "" },
  { label: "未检测", value: "UNCHECKED" },
  { label: "可用", value: "AVAILABLE" },
  { label: "封禁", value: "BANNED" },
  { label: "链接失效", value: "LINK_INVALID" },
  { label: "不可用", value: "UNAVAILABLE" }
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

export const timedMessageOptions = [
  { label: "24小时", value: "24h" },
  { label: "7天", value: "7d" },
  { label: "90天", value: "90d" },
  { label: "关闭", value: "off" }
];

export const groupListColumns: TableColumnList = [
  { label: "群名称", prop: "groupName", minWidth: 220 },
  { label: "群链接", prop: "url", minWidth: 260 },
  { label: "来源文件", prop: "sourceFileName", minWidth: 180 },
  { label: "群状态", prop: "status", width: 120 },
  { label: "群人数", prop: "memberCount", width: 110 },
  { label: "管理员", prop: "admin", minWidth: 170 },
  { label: "来源", prop: "source", width: 120 },
  { label: "时间", prop: "createdAt", width: 180 },
  { label: "操作", prop: "operation", fixed: "right", width: 220 }
];
