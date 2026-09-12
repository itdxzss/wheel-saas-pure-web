import { computed, ref, type Ref } from "vue";
import { ElMessage } from "element-plus";
import { moveStep, validateReplies } from "@/views/task/script-marketing/reply";
import type { ScriptStep } from "@/api/script-marketing";
import {
  copyStep,
  estimatedWait,
  mayRemove,
  newStep,
  nextEditorKey,
  type EditableStep
} from "@/views/task/script-marketing/form";

export interface ComposerRole {
  key: string;
  name: string;
  type: ScriptStep["role"];
}

export function useScriptComposer(steps: Ref<EditableStep[]>) {
  const roles = ref<ComposerRole[]>([]);
  for (const step of steps.value) {
    if (
      !roles.value.some(
        role => role.name === step.roleKey && role.type === step.role
      )
    )
      roles.value.push({
        key: nextEditorKey(),
        name: step.roleKey || "",
        type: step.role
      });
  }
  const activeKey = ref(steps.value[0]?.key || "");
  const activeIndex = computed(() =>
    steps.value.findIndex(step => step.key === activeKey.value)
  );
  const activeStep = computed(() => steps.value[activeIndex.value]);
  const defaultMin = ref(10);
  const defaultMax = ref(10);
  const inherited = ref(new Set<string>());
  const estimate = computed(() => estimatedWait(steps.value));
  const roleFor = (step?: EditableStep) =>
    step &&
    roles.value.find(
      role => role.name === step.roleKey && role.type === step.role
    );
  const count = (role: ComposerRole) =>
    steps.value.filter(step => roleFor(step)?.key === role.key).length;

  function renameRole(key: string, value: string) {
    const role = roles.value.find(role => role.key === key);
    const name = value.trim();
    if (!role) return;
    if (
      !name ||
      roles.value.some(other => other.key !== key && other.name === name)
    ) {
      ElMessage.warning(name ? "角色名称不能重复" : "请填写角色名称");
      return;
    }
    const messages = steps.value.filter(step => roleFor(step)?.key === key);
    role.name = name;
    messages.forEach(step => {
      step.roleKey = name;
    });
  }

  function addRole(type: ScriptStep["role"]) {
    let suffix = 1;
    const prefix = type === "ADMIN" ? "管理员" : "推手";
    while (roles.value.some(role => role.name === `${prefix}${suffix}`))
      suffix++;
    roles.value.push({
      key: nextEditorKey(),
      name: `${prefix}${suffix}`,
      type
    });
  }

  function removeRole(key: string) {
    const role = roles.value.find(role => role.key === key);
    if (!role || count(role)) return;
    roles.value = roles.value.filter(role => role.key !== key);
  }

  function assignRole(step: EditableStep, key: string) {
    const role = roles.value.find(role => role.key === key);
    if (!role) return;
    step.role = role.type;
    step.roleKey = role.name;
    step.accountId = null;
  }

  function validDefaults() {
    return (
      Number.isInteger(defaultMin.value) &&
      Number.isInteger(defaultMax.value) &&
      defaultMin.value >= 0 &&
      defaultMax.value <= 86400 &&
      defaultMax.value >= defaultMin.value
    );
  }

  function syncDefaults() {
    if (!validDefaults()) return;
    steps.value
      .filter(step => inherited.value.has(step.key))
      .forEach(step => {
        step.waitMinSeconds = defaultMin.value;
        step.waitMaxSeconds = defaultMax.value;
      });
  }

  function useDefault(step: EditableStep, enabled: boolean) {
    if (enabled) inherited.value.add(step.key);
    else inherited.value.delete(step.key);
    syncDefaults();
  }

  function applyDefaults() {
    if (!validDefaults()) {
      ElMessage.warning("默认等待须为 0–86400 秒，最大值不小于最小值");
      return;
    }
    inherited.value = new Set(steps.value.map(step => step.key));
    syncDefaults();
  }

  function addMessage(
    roleKey = roleFor(activeStep.value)?.key || roles.value[0]?.key,
    index = steps.value.length
  ) {
    if (steps.value.length >= 100 || !roleKey) return;
    if (!validDefaults()) {
      ElMessage.warning("请先填写有效的默认等待区间");
      return;
    }
    const step = newStep();
    assignRole(step, roleKey);
    steps.value.splice(index, 0, step);
    useDefault(step, true);
    activeKey.value = step.key;
  }

  function duplicate(index: number) {
    if (steps.value.length >= 100) return;
    const source = steps.value[index];
    const step = copyStep(source);
    steps.value.splice(index + 1, 0, step);
    if (inherited.value.has(source.key)) inherited.value.add(step.key);
    activeKey.value = step.key;
  }

  function move(from: number, to: number) {
    if (
      from < 0 ||
      to < 0 ||
      from >= steps.value.length ||
      to >= steps.value.length ||
      from === to
    )
      return;
    if (!moveStep(steps.value, from, to))
      ElMessage.warning("不能把回复放在被引用的对话之前");
  }

  function removeMessage(index: number) {
    if (!mayRemove(steps.value, index)) {
      ElMessage.warning(
        "此句被引用或是该类型的最后一句，请先调整回复目标和角色配置"
      );
      return;
    }
    const [removed] = steps.value.splice(index, 1);
    inherited.value.delete(removed.key);
    if (activeKey.value === removed.key)
      activeKey.value =
        steps.value[Math.min(index, steps.value.length - 1)]?.key || "";
  }

  function validate(): boolean {
    const report = (message: string, step?: EditableStep) => {
      if (step) activeKey.value = step.key;
      ElMessage.warning(message);
      return false;
    };
    if (steps.value.length < 2 || steps.value.length > 100)
      return report("请配置 2–100 条消息");
    const replyError = validateReplies(steps.value);
    if (replyError) return report(replyError);
    if (
      !steps.value.some(step => step.role === "ADMIN") ||
      !steps.value.some(step => step.role === "PROMOTER")
    )
      return report("至少保留一条管理员消息和一条推手消息");
    for (const [index, step] of steps.value.entries()) {
      if (!step.roleKey?.trim())
        return report(`第 ${index + 1} 条消息请填写角色名称`, step);
      if (
        !step.message.content.trim() &&
        !(step.message.linkMode === 3 && step.message.imageFileId)
      )
        return report(`第 ${index + 1} 条消息请填写内容或选择图片`, step);
      if (
        !Number.isInteger(step.waitMinSeconds) ||
        !Number.isInteger(step.waitMaxSeconds) ||
        step.waitMinSeconds === null ||
        step.waitMaxSeconds === null ||
        step.waitMinSeconds < 0 ||
        step.waitMaxSeconds > 86400 ||
        step.waitMaxSeconds < step.waitMinSeconds
      )
        return report(
          `第 ${index + 1} 条消息等待区间须为 0–86400 秒，最大值不小于最小值`,
          step
        );
    }
    return true;
  }

  return {
    roles,
    activeKey,
    activeIndex,
    activeStep,
    defaultMin,
    defaultMax,
    inherited,
    estimate,
    roleFor,
    count,
    renameRole,
    addRole,
    removeRole,
    assignRole,
    syncDefaults,
    useDefault,
    applyDefaults,
    addMessage,
    duplicate,
    move,
    removeMessage,
    validate
  };
}
