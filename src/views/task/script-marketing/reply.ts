import type { ScriptStep } from "@/api/script-marketing";

let sequence = 0;
const session = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
/** 局部业务身份，无需安全上下文，支持测试环境普通 HTTP。 */
export function newStepId(): string {
  return `step_${session}_${++sequence}`;
}
export function validateReplies(steps: ScriptStep[]): string | undefined {
  const seen = new Set<string>();
  for (const [index, step] of steps.entries()) {
    if (!step.stepId || step.stepId.length > 64 || seen.has(step.stepId))
      return `第 ${index + 1} 句标识缺失或重复，请重新打开剧本`;
    if (step.replyToStepId && !seen.has(step.replyToStepId))
      return `第 ${index + 1} 句回复目标必须是前面的一句对话`;
    seen.add(step.stepId);
  }
}
/** 先校验候选顺序，非法移动不改变原数组。 */
export function moveStep(
  steps: ScriptStep[],
  from: number,
  to: number
): boolean {
  if (
    from < 0 ||
    to < 0 ||
    from >= steps.length ||
    to >= steps.length ||
    from === to
  )
    return false;
  const next = [...steps];
  next.splice(to, 0, next.splice(from, 1)[0]);
  if (validateReplies(next)) return false;
  steps.splice(to, 0, steps.splice(from, 1)[0]);
  return true;
}
export function replySummary(step: ScriptStep, index: number): string {
  const text =
    [
      step.message.imageFileId ? "[图片]" : "",
      step.message.content,
      step.message.bodyText
    ]
      .filter(Boolean)
      .join(" ") || "[未填写]";
  return `第 ${index + 1} 句 · ${step.roleKey || "未命名角色"}：${text.slice(0, 80)}`;
}
