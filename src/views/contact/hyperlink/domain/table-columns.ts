export const contactTaskColumns: TableColumnList = [
  { label: "选择", prop: "selection", fixed: "left" },
  { label: "ID", prop: "id" },
  { label: "任务名称", prop: "name" },
  { label: "消息类型 / 内容", prop: "content" },
  { label: "状态", prop: "status" },
  { label: "进度（成功 / 计划）", prop: "progress" },
  { label: "账号统计", prop: "accountStats" },
  { label: "账号范围", prop: "accountRange" },
  { label: "计划开始时间", prop: "taskStartAt" },
  { label: "操作", prop: "actions", fixed: "right" }
];
