import type {
  GroupPullMarketingGroupRow,
  GroupPullBlockReason,
  GroupPullResourceStatus,
  GroupPullSpeakPermission,
  GroupPullTaskStatus
} from "@/api/group-pull-marketing";
import { formatEpochMillis } from "@/utils/time";

export type GroupPullTaskAction =
  | "start"
  | "pause"
  | "resume"
  | "release"
  | "detail"
  | "delete";

export const taskStatusOptions: Array<{
  label: string;
  value: GroupPullTaskStatus;
}> = [
  { label: "待启动", value: 1 },
  { label: "执行中", value: 2 },
  { label: "已暂停", value: 5 },
  { label: "已完成", value: 7 },
  { label: "已手动结束", value: 8 }
];

export const blockReasonOptions: Array<{
  label: string;
  value: GroupPullBlockReason;
}> = [
  { label: "无", value: 0 },
  { label: "等待建群账号", value: 1 },
  { label: "等待营销账号", value: 2 },
  { label: "等待料子数据", value: 3 },
  { label: "系统异常", value: 4 },
  { label: "人工处理", value: 5 }
];

export const resourceStatusOptions: Array<{
  label: string;
  value: GroupPullResourceStatus;
}> = [
  { label: "未锁定", value: 1 },
  { label: "已锁定", value: 2 },
  { label: "释放中", value: 3 },
  { label: "已释放", value: 4 }
];

export const speakPermissionOptions: Array<{
  label: string;
  value: GroupPullSpeakPermission;
}> = [
  { label: "不操作", value: 1 },
  { label: "禁言", value: 2 },
  { label: "不禁言", value: 3 }
];

/** 一级任务表只声明通用列，复杂状态与统计单元格由表格组件具名插槽渲染。 */
export const taskColumns: TableColumnList = [
  { label: "任务信息", prop: "taskName", minWidth: 260 },
  { label: "任务状态", prop: "status", minWidth: 190 },
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
  { label: "时间/操作", prop: "lastExecutedAt", minWidth: 250 }
];

function optionLabel<T extends number>(
  options: Array<{ label: string; value: T }>,
  value?: number | null
): string {
  return options.find(option => option.value === value)?.label ?? "-";
}

/** 返回任务主状态中文文案，未知值不做猜测。 */
export function taskStatusLabel(status?: number | null): string {
  return optionLabel(taskStatusOptions, status);
}

/** 返回执行阻塞原因中文文案，未知值不做猜测。 */
export function blockReasonLabel(reason?: number | null): string {
  return optionLabel(blockReasonOptions, reason);
}

/** 返回资源状态中文文案，未知值不做猜测。 */
export function resourceStatusLabel(status?: number | null): string {
  return optionLabel(resourceStatusOptions, status);
}

/** 返回群组发言权限中文文案。 */
export function speakPermissionLabel(permission?: number | null): string {
  return optionLabel(speakPermissionOptions, permission);
}

/** 根据主状态和资源状态生成唯一的行操作集合，模板不再重复维护状态判断。 */
export function groupPullTaskActions(task: {
  status: GroupPullTaskStatus;
  resourceStatus: GroupPullResourceStatus;
}): GroupPullTaskAction[] {
  if (task.status === 1 && task.resourceStatus === 1) {
    return ["start", "detail", "delete"];
  }
  if (task.status === 2 && task.resourceStatus === 2) {
    return ["pause", "release", "detail"];
  }
  if (task.status === 5 && task.resourceStatus === 2) {
    return ["resume", "release", "detail"];
  }
  return ["detail"];
}

/** 禁言或建群账号退出时，营销账号必须先取得群管理员权限。 */
export function requiresMarketerAdmin(
  speakPermission: GroupPullSpeakPermission,
  builderExitEnabled: boolean
): boolean {
  return speakPermission === 2 || builderExitEnabled;
}

/** 将后端 epoch 毫秒转换成页面统一时间格式。 */
export function formatEpoch(value?: number | null): string {
  return formatEpochMillis(value);
}

/** 返回任务主状态对应的 Element Plus 标签类型。 */
export function taskStatusTagType(status?: number | null) {
  if (status === 2) return "primary";
  if (status === 5) return "warning";
  if (status === 7) return "success";
  return "info";
}

/** 返回阻塞原因对应的 Element Plus 标签类型。 */
export function blockReasonTagType(reason?: number | null) {
  if (reason === 4 || reason === 5) return "danger";
  if (reason === 1 || reason === 2 || reason === 3) return "warning";
  return "info";
}

/** 返回资源状态对应的 Element Plus 标签类型。 */
export function resourceStatusTagType(status?: number | null) {
  if (status === 2) return "primary";
  if (status === 3) return "warning";
  if (status === 4) return "success";
  return "info";
}

/** 返回群组当前状态，后端当前只定义正常和封禁。 */
export function groupStatusLabel(status?: number | null): string {
  if (status === 1) return "正常";
  if (status === 2) return "封禁";
  return "-";
}

/** 群状态为空时使用中性样式，避免失败记录被误标为正常。 */
export function groupStatusTagType(status?: number | null) {
  if (status === 1) return "success";
  if (status === 2) return "danger";
  return "info";
}

/** 返回单群建群执行结果。 */
export function executionStatusLabel(status?: number | null): string {
  return (
    {
      1: "准备中",
      2: "建群中",
      3: "成功",
      4: "失败",
      5: "建群前跳过",
      6: "已取消",
      7: "人工处理"
    }[status ?? 0] ?? "-"
  );
}

/** 返回建群执行失败或完成时所在阶段。 */
export function executionStageLabel(stage?: number | null): string {
  return (
    {
      1: "资源分配",
      2: "好友添加",
      3: "创建群组",
      4: "添加营销账号",
      5: "添加料子",
      6: "管理员设置",
      7: "权限设置",
      8: "群信息保存",
      9: "建群账号退群",
      10: "结果结算",
      11: "完成"
    }[stage ?? 0] ?? "-"
  );
}

/** 返回建群账号实际退群状态。 */
export function builderExitStatusLabel(status?: number | null): string {
  return (
    { 0: "未退出", 1: "待退出", 2: "已退出", 3: "退出失败" }[status ?? -1] ??
    "-"
  );
}

/** 返回营销账号管理员设置状态。 */
export function marketerAdminStatusLabel(status?: number | null): string {
  return (
    { 0: "未设置", 1: "待设置", 2: "已设置", 3: "设置失败" }[status ?? -1] ??
    "-"
  );
}

/** 返回当前群组营销消息发送状态。 */
export function marketingSendStatusLabel(status?: number | null): string {
  return (
    {
      1: "待发送",
      2: "发送中",
      3: "已完成",
      4: "失败",
      5: "部分失败",
      6: "已跳过",
      7: "已停止"
    }[status ?? 0] ?? "-"
  );
}

export interface GroupInviteLinkMeta {
  label: string;
  url: string | null;
  available: boolean;
}

function safeWhatsappInviteUrl(value?: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "chat.whatsapp.com"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

/** 校验群邀请链接并派生打开、复制按钮状态，禁止渲染不可信协议。 */
export function groupLinkMeta(
  row: Pick<
    GroupPullMarketingGroupRow,
    "groupInviteUrl" | "groupStatus" | "failureReason"
  >
): GroupInviteLinkMeta {
  if (row.groupStatus === 2) {
    return { label: "链接已失效", url: null, available: false };
  }
  const safeUrl = safeWhatsappInviteUrl(row.groupInviteUrl);
  if (safeUrl) {
    return { label: safeUrl, url: safeUrl, available: true };
  }
  if (row.failureReason?.includes("链接")) {
    return { label: "链接获取失败", url: null, available: false };
  }
  return { label: "未获取群链接", url: null, available: false };
}
