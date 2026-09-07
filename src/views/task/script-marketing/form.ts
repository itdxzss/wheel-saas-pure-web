import type { ScriptSave, ScriptStep } from "@/api/script-marketing";

export type EditableStep = ScriptStep & { key: string };
export function newStep(role: ScriptStep["role"] = "PROMOTER"): EditableStep {
  return {
    key: crypto.randomUUID(),
    role,
    accountId: null,
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
  return { ...JSON.parse(JSON.stringify(step)), key: crypto.randomUUID() };
}
export function mayRemove(steps: ScriptStep[], index: number): boolean {
  return steps.filter(step => step.role === steps[index]?.role).length > 1;
}
export function validateScript(form: ScriptSave): string | undefined {
  if (
    !Number.isInteger(form.intervalSeconds) ||
    form.intervalSeconds < 1 ||
    form.intervalSeconds > 86400
  )
    return "发送间隔须为 1–86400 秒";
  if (!form.taskName.trim()) return "请填写任务名称";
  if (!form.groupLinkIds.length) return "请选择目标群";
  if (form.steps.length < 2 || form.steps.length > 100)
    return "请配置 2–100 个发送项";
  const roles = new Map<number, string>();
  for (const [index, step] of form.steps.entries()) {
    if (!step.accountId) return `第 ${index + 1} 项请选择账号`;
    if (!step.message.content.trim()) return `第 ${index + 1} 项请填写消息内容`;
    if (roles.has(step.accountId) && roles.get(step.accountId) !== step.role)
      return "同一账号的角色必须一致，管理员与推手请选择不同账号";
    roles.set(step.accountId, step.role);
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
      role: step.role,
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
