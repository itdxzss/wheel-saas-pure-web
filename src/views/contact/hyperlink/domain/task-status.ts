/**
 * 通讯录任务的双状态展示口径与行操作分支。
 *
 * 任务有两个独立状态字段，缺一不可：
 * - `isEnabled`  0 已停用（仅保存不发送） / 1 启用
 * - `runStatus`  0 未开始 / 1 进行中 / 2 已完成 / 3 已暂停 / 4 已停止
 *
 * 展示优先级：`isEnabled=0` 一律显示「已停用」，否则才按 `runStatus` 显示。
 */

export type ContactTaskRowAction =
  | "start"
  | "pause"
  | "resume"
  | "stop"
  | "edit"
  | "view"
  | "data";

export type StatusTagType =
  | "info"
  | "primary"
  | "success"
  | "warning"
  | "danger";

const RUN_STATUS_LABELS: Record<number, string> = {
  0: "未开始",
  1: "进行中",
  2: "已完成",
  3: "已暂停",
  4: "已停止"
};

const RUN_STATUS_TAGS: Record<number, StatusTagType> = {
  0: "info",
  1: "primary",
  2: "success",
  3: "warning",
  4: "danger"
};

/** 搜索区状态下拉的选项，与后端 runStatus 取值一一对应。 */
export const RUN_STATUS_OPTIONS: { value: number; label: string }[] = [
  0, 1, 2, 3, 4
].map(value => ({ value, label: RUN_STATUS_LABELS[value] }));

/**
 * 状态列文案。
 *
 * @param isEnabled 任务开关
 * @param runStatus 运行状态
 * @returns 展示文案
 */
export function statusLabel(isEnabled: number, runStatus: number): string {
  if (isEnabled === 0) {
    return "已停用";
  }
  return RUN_STATUS_LABELS[runStatus] ?? "未开始";
}

/**
 * 状态标签配色。
 *
 * @param isEnabled 任务开关
 * @param runStatus 运行状态
 * @returns Element Plus tag type
 */
export function statusTagType(
  isEnabled: number,
  runStatus: number
): StatusTagType {
  if (isEnabled === 0) {
    return "info";
  }
  return RUN_STATUS_TAGS[runStatus] ?? "info";
}

/**
 * 行操作按钮，按运行状态分支。
 *
 * 「账号数据」在任何状态都有；**没有删除**——接口没有，竞品也没有。
 * 停用只是「保存了不发」，因此仍可编辑与启动。
 *
 * @param isEnabled 任务开关
 * @param runStatus 运行状态
 * @returns 该行应渲染的操作
 */
export function rowActions(
  isEnabled: number,
  runStatus: number
): ContactTaskRowAction[] {
  void isEnabled;
  switch (runStatus) {
    case 1:
      return ["pause", "stop", "view", "data"];
    case 3:
      return ["resume", "stop", "view", "data"];
    case 2:
    case 4:
      return ["view", "data"];
    default:
      return ["start", "edit", "data"];
  }
}
