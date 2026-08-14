import type { CommonGroupTaskDetailResult } from "@/api/common-group-task";

const TERMINAL_ITEM_STATUSES = [
  "CREATED",
  "CREATED_PARTIAL",
  "RESULT_UNKNOWN",
  "FAILED"
] as const;
const SETTINGS_STEPS = ["APPLYING_SETTINGS", "LEAVING_GROUP", "DONE"];

function isTerminalItem(status: string): boolean {
  return TERMINAL_ITEM_STATUSES.some(value => value === status);
}

function appendTaskResult(
  logs: string[],
  status: CommonGroupTaskDetailResult["task"]["status"]
): void {
  if (status === "SUCCESS") {
    logs.push("任务执行结束：全部群组创建成功。");
  } else if (status === "PARTIAL") {
    logs.push("任务执行结束：部分群组创建成功，请查看结果明细。");
  } else if (status === "FAILED") {
    logs.push("任务执行结束：未成功创建群组，请查看结果明细。");
  }
}

/** 根据后端真实阶段快照生成业务日志，不推断未进入过的后续阶段。 */
export function buildCommonGroupTaskLogs(
  detail: CommonGroupTaskDetailResult
): string[] {
  const logs = ["任务已提交，开始执行新建普群流程。"];
  if (detail.items.length === 0) {
    logs.push("等待开始互为好友阶段。");
    return logs;
  }
  const isRunningStep = (step: string) =>
    detail.items.some(
      row => row.currentStep === step && !isTerminalItem(row.status)
    );
  if (isRunningStep("PREPARING_CONTACTS")) {
    logs.push("正在进行互为好友阶段。");
    return logs;
  }
  const stoppedAtContactsCount = detail.items.filter(
    row =>
      row.currentStep === "PREPARING_CONTACTS" && isTerminalItem(row.status)
  ).length;
  if (stoppedAtContactsCount === detail.items.length) {
    logs.push("互为好友阶段已结束，任务未进入新建普群阶段。");
    appendTaskResult(logs, detail.task.status);
    return logs;
  }
  logs.push(
    stoppedAtContactsCount === 0
      ? "互为好友阶段已完成，进入新建普群阶段。"
      : "互为好友阶段已结束，部分群组进入新建普群阶段。"
  );
  if (isRunningStep("CREATING_GROUP")) {
    logs.push("正在进行新建普群阶段。");
    return logs;
  }

  const settingsItemCount = detail.items.filter(row =>
    SETTINGS_STEPS.includes(row.currentStep)
  ).length;
  if (settingsItemCount === 0) {
    logs.push("新建普群阶段已结束，后续群配置阶段未执行完成。");
    appendTaskResult(logs, detail.task.status);
    return logs;
  }
  logs.push(
    settingsItemCount === detail.items.length
      ? "新建普群阶段已完成，进入设置管理员与群配置阶段。"
      : "新建普群阶段已结束，部分群组进入设置管理员与群配置阶段。"
  );
  if (isRunningStep("APPLYING_SETTINGS") || isRunningStep("LEAVING_GROUP")) {
    logs.push("正在进行设置管理员与群配置阶段。");
    return logs;
  }
  logs.push(
    detail.task.status === "SUCCESS"
      ? "设置管理员与群配置阶段已完成。"
      : "设置管理员与群配置阶段已结束，结果请查看明细。"
  );
  appendTaskResult(logs, detail.task.status);
  return logs;
}
