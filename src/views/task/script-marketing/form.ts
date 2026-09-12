import type { ScriptSave, ScriptStep } from "@/api/script-marketing";
import { newStepId, validateReplies } from "./reply";

let editorKey = 0;
// 仅用于页面渲染，不发送到后端；普通 HTTP 也必须能创建配置项。
export function nextEditorKey(): string {
  return `script-editor-${++editorKey}`;
}

export type EditableStep = ScriptStep & {
  key: string;
  stepId: string;
  replyToStepId: string | null;
};
export function newStep(role: ScriptStep["role"] = "PROMOTER"): EditableStep {
  return {
    key: nextEditorKey(),
    stepId: newStepId(),
    replyToStepId: null,
    role,
    accountId: null,
    roleKey: role === "ADMIN" ? "管理员" : `推手${editorKey}`,
    waitMinSeconds: 10,
    waitMaxSeconds: 10,
    message: {
      templateName: "",
      linkMode: 1,
      content: "",
      bodyText: "",
      imageFileId: null,
      promotionLink: "",
      mentionAll: false,
      buttons: []
    }
  };
}
export function copyStep(step: ScriptStep): EditableStep {
  return {
    ...JSON.parse(JSON.stringify(step)),
    key: nextEditorKey(),
    stepId: newStepId(),
    replyToStepId: step.replyToStepId || null,
    roleKey:
      step.roleKey ||
      `${step.role === "ADMIN" ? "管理员" : "推手"}${step.accountId || ""}`,
    accountId: null,
    waitMinSeconds: step.waitMinSeconds ?? 10,
    waitMaxSeconds: step.waitMaxSeconds ?? 10
  };
}
export function mayRemove(steps: ScriptStep[], index: number): boolean {
  return (
    steps.filter(step => step.role === steps[index]?.role).length > 1 &&
    !steps.some(
      step => step.replyToStepId && step.replyToStepId === steps[index]?.stepId
    )
  );
}
/** 读取与选入任务保留句子身份；旧数据按位置得到确定 ID。 */
export function hydrateScriptSteps(steps: ScriptStep[]): EditableStep[] {
  return steps.map((step, index) => ({
    ...copyStep(step),
    stepId: step.stepId || `legacy_${index}`
  }));
}
/** 复制整份剧本时同时重建所有内部引用。 */
export function cloneScriptSteps(steps: ScriptStep[]): EditableStep[] {
  const source = hydrateScriptSteps(steps);
  const copies = source.map(copyStep);
  const ids = new Map(
    source.map((step, index) => [step.stepId, copies[index].stepId])
  );
  copies.forEach(step => {
    if (step.replyToStepId)
      step.replyToStepId = ids.get(step.replyToStepId) ?? step.replyToStepId;
  });
  return copies;
}
export function validateScript(form: ScriptSave): string | undefined {
  if (
    !Number.isInteger(form.intervalSeconds) ||
    form.intervalSeconds < 1 ||
    form.intervalSeconds > 86400
  )
    return "发送间隔须为 1–86400 秒";
  if (!form.taskName.trim()) return "请填写任务名称";
  if (!form.steps.length) return "请选择剧本";
  if (!form.accountGroupId) return "请选择推手账号分组";
  if (!form.groupLinkIds.length) return "请选择目标群";
  if (form.steps.length < 2 || form.steps.length > 100)
    return "请配置 2–100 个发送项";
  const replyError = validateReplies(form.steps);
  if (replyError) return replyError;
  const roles = new Map<string, ScriptStep>();
  for (const [index, step] of form.steps.entries()) {
    if (!step.roleKey?.trim()) return `第 ${index + 1} 项请填写角色名称`;
    if (step.accountId)
      return "管理员与推手由系统启动时按群分配，无需手动选择账号";
    if (
      !step.message.content.trim() &&
      !(step.message.linkMode === 3 && step.message.imageFileId)
    )
      return `第 ${index + 1} 项请填写消息内容或选择图片`;
    if (
      step.waitMinSeconds === null ||
      step.waitMaxSeconds === null ||
      !Number.isInteger(step.waitMinSeconds) ||
      !Number.isInteger(step.waitMaxSeconds) ||
      step.waitMinSeconds < 0 ||
      step.waitMaxSeconds > 86400 ||
      step.waitMaxSeconds < step.waitMinSeconds
    )
      return `第 ${index + 1} 项等待区间须为 0–86400 秒，最大值不小于最小值`;
    const previous = roles.get(step.roleKey);
    if (
      previous &&
      (previous.role !== step.role || previous.accountId !== step.accountId)
    )
      return "同一角色的类型必须一致";
    roles.set(step.roleKey, step);
  }
  if (
    !form.steps.some(s => s.role === "ADMIN") ||
    !form.steps.some(s => s.role === "PROMOTER")
  )
    return "至少保留一个管理员和一个推手";
  if (form.endAt && form.endAt <= Math.max(Date.now(), form.startAt || 0))
    return "截止时间必须晚于开始时间和当前时间";
  return undefined;
}
export function toScriptSave(form: ScriptSave): ScriptSave {
  return {
    ...form,
    startAt: form.startAt ? Number(form.startAt) : null,
    endAt: form.endAt ? Number(form.endAt) : null,
    taskName: form.taskName.trim(),
    steps: form.steps.map(step => ({
      stepId: step.stepId,
      replyToStepId: step.replyToStepId || null,
      role: step.role,
      roleKey: step.roleKey?.trim() || "",
      waitMinSeconds: step.waitMinSeconds,
      waitMaxSeconds: step.waitMaxSeconds,
      accountId: step.accountId,
      message: {
        ...step.message,
        buttons: step.message.linkMode === 2 ? step.message.buttons : [],
        promotionLink:
          step.message.linkMode === 2 ? "" : step.message.promotionLink
      }
    }))
  };
}
/** 预计每群等待时间，首条不等待，不包含发送、排队和异常耗时。 */
export function estimatedWait(steps: ScriptStep[]): [number, number] {
  return steps
    .slice(1)
    .reduce<
      [number, number]
    >((sum, step) => [sum[0] + (step.waitMinSeconds ?? 0), sum[1] + (step.waitMaxSeconds ?? 0)], [0,
        0]);
}
export const taskLabels = [
  "草稿",
  "运行中 / 等待开始",
  "已暂停",
  "执行完成",
  "已关闭"
];
export const recordLabels: Record<number, string> = {
  1: "等待原结果",
  2: "成功",
  3: "失败",
  4: "结果未知",
  5: "暂停未投递"
};
