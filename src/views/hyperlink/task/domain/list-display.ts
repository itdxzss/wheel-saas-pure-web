import type {
  HyperlinkAccountFilter,
  HyperlinkFilterOption,
  HyperlinkTaskListItem,
  HyperlinkTaskMode
} from "@/api/hyperlink-task-list";

export interface HyperlinkTaskTableColumn {
  label: string;
  prop: string;
  hide?: boolean;
  minWidth?: number;
  width?: number;
  fixed?: "left" | "right";
}

export interface HyperlinkTaskColumnPreference {
  prop: string;
  hide: boolean;
}

export interface HyperlinkTaskPageMetrics {
  taskCount: number;
  recipientTotal: number;
  successNum: number;
  deliveredNum: number;
  deliveryRate: string;
  clickUvNum: number;
  clickRate: string;
}

export type HyperlinkTaskRowAction =
  | "START"
  | "PAUSE"
  | "RESUME"
  | "STOP"
  | "EDIT"
  | "VIEW"
  | "DETAIL"
  | "COPY";

export function createHyperlinkTaskTableColumns(): HyperlinkTaskTableColumn[] {
  return [
    { label: "ID", prop: "id", width: 82, fixed: "left" },
    { label: "任务名称", prop: "taskName", minWidth: 300 },
    { label: "数据包", prop: "dataPackage", minWidth: 180 },
    { label: "账号范围", prop: "accountFilter", minWidth: 250 },
    { label: "营销目标国家", prop: "countries", minWidth: 180 },
    { label: "状态", prop: "status", width: 110 },
    { label: "账号统计", prop: "accountStats", minWidth: 180 },
    { label: "进度", prop: "progress", minWidth: 250 },
    { label: "双钩数/双钩率", prop: "delivery", minWidth: 160 },
    { label: "点击 UV/点击率", prop: "click", minWidth: 160 },
    { label: "最大执行账号数", prop: "concurrency", width: 150 },
    { label: "已执行时长", prop: "duration", width: 130 },
    { label: "结束/周期", prop: "schedule", minWidth: 180 },
    { label: "创建时间", prop: "createdAt", width: 180 },
    { label: "操作", prop: "actions", width: 238, fixed: "right" }
  ];
}

export function mergeColumnPreferences(
  defaults: HyperlinkTaskTableColumn[],
  preferences: HyperlinkTaskColumnPreference[]
): HyperlinkTaskTableColumn[] {
  const known = new Map(preferences.map(item => [item.prop, item.hide]));
  return defaults.map(column => ({
    ...column,
    hide: column.fixed ? false : known.get(column.prop) === true
  }));
}

export function toColumnPreferences(
  columns: HyperlinkTaskTableColumn[]
): HyperlinkTaskColumnPreference[] {
  return columns.map(column => ({
    prop: column.prop,
    hide: column.fixed ? false : column.hide === true
  }));
}

/** access token 是当前用户+租户会话边界；只保存不可逆短哈希，不把凭据写入键名。 */
export function currentUserTenantColumnKey(
  username: string | undefined,
  accessToken: string | undefined
): string {
  let hash = 2166136261;
  for (const character of accessToken ?? "anonymous") {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `hyperlink-task-list-columns:v1:${username ?? "anonymous"}:${(
    hash >>> 0
  ).toString(16)}`;
}

export function currentPageMetrics(
  rows: HyperlinkTaskListItem[]
): HyperlinkTaskPageMetrics {
  const trackedRows = rows.filter(row => row.shortLinkEnabled);
  const deliveredNum = sum(rows, "deliveredNum");
  const successNum = sum(rows, "successNum");
  const trackedSuccess = sum(trackedRows, "successNum");
  const clickUvNum = sum(trackedRows, "clickUvNum");
  return {
    taskCount: rows.length,
    recipientTotal: sum(rows, "recipientTotal"),
    successNum,
    deliveredNum,
    deliveryRate: percentage(deliveredNum, successNum, "-"),
    clickUvNum,
    clickRate: percentage(clickUvNum, trackedSuccess, "-")
  };
}

export function rowActions(
  row: HyperlinkTaskListItem
): HyperlinkTaskRowAction[] {
  const common: HyperlinkTaskRowAction[] = ["DETAIL", "COPY"];
  if (row.runStatus === 0) return ["START", "EDIT", ...common];
  if (row.runStatus === 1) return ["PAUSE", "STOP", "VIEW", ...common];
  if (row.runStatus === 3) return ["RESUME", "STOP", "VIEW", ...common];
  return ["VIEW", ...common];
}

export function accountFilterLabels(
  filter: HyperlinkAccountFilter | null | undefined,
  options: {
    groups?: HyperlinkFilterOption[];
    channels?: HyperlinkFilterOption[];
    protocols?: HyperlinkFilterOption[];
  } = {}
): string[] {
  if (!filter) return [];
  const labels: string[] = [];
  addList(labels, "包含国家", filter.countryIso2s);
  addList(labels, "排除国家", filter.excludeCountryIso2s);
  add(labels, "大洲", filter.continent);
  addOptions(labels, "业务组", filter.groupIds, options.groups);
  addOptions(labels, "渠道", filter.channelIds, options.channels);
  addOption(labels, "协议", filter.protocolId, options.protocols);
  add(labels, "在线状态", mapOnline(filter.onlineStatus));
  add(labels, "轮转状态", mapValue(filter.rotationStatus, rotationLabels));
  add(labels, "账号类型", mapValue(filter.accountType, accountTypeLabels));
  add(labels, "平台", mapValue(filter.platform, platformLabels));
  add(labels, "设备类型", mapValue(filter.widType, widTypeLabels));
  add(labels, "导入方式", mapValue(filter.importMode, importModeLabels));
  add(
    labels,
    "允许拉群",
    filter.groupInviteAllowed == null
      ? null
      : filter.groupInviteAllowed
        ? "是"
        : "否"
  );
  add(labels, "手机号", filter.phone);
  add(labels, "导入批次", filter.importBatchId);
  add(labels, "来源", mapValue(filter.source, sourceLabels));
  addRange(labels, "好友数", filter.friendCountMin, filter.friendCountMax);
  addRange(
    labels,
    "存活天数",
    filter.retentionDaysMin,
    filter.retentionDaysMax
  );
  addRange(labels, "注册天数", filter.registerDaysMin, filter.registerDaysMax);
  addRange(labels, "入库时间", filter.createdAtFrom, filter.createdAtTo);
  return labels;
}

export function percentage(
  numerator: number,
  denominator: number,
  zero = "0.00%"
): string {
  if (denominator <= 0) return zero;
  return `${((numerator * 100) / denominator).toFixed(2)}%`;
}

export function average(numerator: number, denominator: number): string {
  if (denominator <= 0) return "0.0";
  return (numerator / denominator).toFixed(1);
}

export function messageTypeLabel(type: number): string {
  return (
    { 1: "单图文", 2: "双图文", 3: "普通按钮", 4: "卡片按钮" }[type] ??
    `未知(${type})`
  );
}

export function taskModeLabel(mode: HyperlinkTaskMode): string {
  return { instant: "即时", rolling: "预发布", cycle: "周期" }[mode];
}

export function taskModeHelp(mode: HyperlinkTaskMode): string {
  return {
    instant: "一次性发送当前冻结的数据包受众",
    rolling: "在计划结束前允许符合条件的新账号加入执行",
    cycle: "按周期间隔选择账号，持续处理剩余受众"
  }[mode];
}

export function taskStatus(row: HyperlinkTaskListItem): {
  label: string;
  type: "info" | "primary" | "success" | "warning" | "danger";
} {
  if (!row.enabled) return { label: "已停用", type: "info" };
  return (
    {
      0: { label: "未开始", type: "info" },
      1: { label: "进行中", type: "primary" },
      2: { label: "已完成", type: "success" },
      3: { label: "已暂停", type: "warning" },
      4: { label: "已停止", type: "danger" }
    } as const
  )[row.runStatus];
}

export function formatDuration(seconds: number): string {
  const value = Math.max(0, Math.floor(seconds));
  if (value < 60) return `${value}s`;
  if (value < 3600) return `${Math.floor(value / 60)}m ${value % 60}s`;
  return `${Math.floor(value / 3600)}h ${Math.floor((value % 3600) / 60)}m`;
}

export function formatCycleInterval(minutes: number): string {
  if (minutes % 1440 === 0) return `每 ${minutes / 1440} 天`;
  if (minutes % 60 === 0) return `每 ${minutes / 60} 小时`;
  return `每 ${minutes} 分钟`;
}

export function countryLabel(
  iso2: string | null,
  options: HyperlinkFilterOption[]
): string {
  if (iso2 == null) return "未知国家";
  const option = options.find(item => item.value === iso2);
  return option ? `${option.label} (${iso2})` : iso2;
}

function sum(
  rows: HyperlinkTaskListItem[],
  key: keyof HyperlinkTaskListItem
): number {
  return rows.reduce((total, row) => {
    const value = row[key];
    return total + (typeof value === "number" ? value : 0);
  }, 0);
}

function add(labels: string[], name: string, value: unknown): void {
  if (value !== null && value !== undefined && String(value).trim()) {
    labels.push(`${name}：${value}`);
  }
}

function addList(
  labels: string[],
  name: string,
  values: Array<string | number> | null | undefined
): void {
  if (values?.length) labels.push(`${name}：${values.join("/")}`);
}

function addRange(
  labels: string[],
  name: string,
  start: number | null,
  end: number | null
): void {
  if (start != null || end != null) {
    labels.push(`${name}：${start ?? "不限"}~${end ?? "不限"}`);
  }
}

function addOptions(
  labels: string[],
  name: string,
  values: number[] | null,
  options: HyperlinkFilterOption[] | undefined
): void {
  if (!values?.length) return;
  labels.push(
    `${name}：${values
      .map(
        value =>
          options?.find(item => item.value === value)?.label ?? `#${value}`
      )
      .join("/")}`
  );
}

function addOption(
  labels: string[],
  name: string,
  value: string | null,
  options: HyperlinkFilterOption[] | undefined
): void {
  if (value == null) return;
  add(
    labels,
    name,
    options?.find(item => item.value === value)?.label ?? value
  );
}

function mapOnline(value: string | null): string | null {
  if (value == null) return null;
  return { ONLINE: "在线", OFFLINE: "离线" }[value] ?? `未知(${value})`;
}

function mapValue(
  value: string | number | null,
  labels: Record<string | number, string>
): string | null {
  if (value == null) return null;
  return labels[value] ?? `未知(${value})`;
}

const rotationLabels = { 0: "未轮转", 1: "轮转中", 2: "已轮转", 3: "轮转失败" };
const accountTypeLabels = { 1: "个人号", 2: "商业号" };
const platformLabels = {
  ANDROID_PERSONAL: "Android 个人版",
  ANDROID_BUSINESS_PRIMARY: "Android 商业主设备",
  ANDROID_BUSINESS_COMPANION: "Android 商业伴随设备",
  IOS_PERSONAL: "iOS 个人版",
  IOS_BUSINESS_PRIMARY: "iOS 商业主设备",
  IOS_BUSINESS_COMPANION: "iOS 商业伴随设备"
};
const widTypeLabels = { web5: "Web 设备", native6: "Native 设备" };
const importModeLabels = { six_segment: "六段导入", full_param: "完整参数" };
const sourceLabels = {
  0: "买量",
  1: "自登",
  2: "买入",
  3: "转入",
  4: "群扫码"
};
