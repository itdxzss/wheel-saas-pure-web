import type {
  HyperlinkStrategyDetail,
  HyperlinkStrategyPayload,
  HyperlinkStrategyUpdatePayload
} from "@/api/hyperlink-strategy";
import type {
  HyperlinkAccountFilter,
  HyperlinkTaskMode
} from "@/api/hyperlink-task";
import {
  createEmptyAccountFilter,
  normalizeAccountFilter,
  validateAccountFilter
} from "../../task/domain/editor-rules";

export interface HyperlinkStrategyForm extends HyperlinkStrategyPayload {
  version: number | null;
}

export const STRATEGY_TASK_MODES: Array<{
  value: HyperlinkTaskMode;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    value: "instant",
    label: "即时群发",
    shortLabel: "即时",
    description: "按计划快速发完整个数据包，速度最快"
  },
  {
    value: "rolling",
    label: "预发布",
    shortLabel: "预发布",
    description: "持续运营，符合筛选的新账号可自动加入"
  },
  {
    value: "cycle",
    label: "周期循环",
    shortLabel: "周期",
    description: "按固定间隔循环执行，用于观察时段表现"
  }
];

function cloneFilter(filter: HyperlinkAccountFilter): HyperlinkAccountFilter {
  return JSON.parse(JSON.stringify(filter)) as HyperlinkAccountFilter;
}

export function createHyperlinkStrategyForm(
  defaultGroupIds: number[] = []
): HyperlinkStrategyForm {
  return {
    version: null,
    name: "",
    taskMode: "instant",
    accountFilter: createEmptyAccountFilter(defaultGroupIds),
    maxExecutingAccounts: 10,
    maxUseAccounts: 0,
    maxSendPerAccount: 0,
    cycleIntervalMinutes: 60,
    enabled: true
  };
}

export function strategyDetailToForm(
  detail: HyperlinkStrategyDetail
): HyperlinkStrategyForm {
  return {
    version: detail.version,
    name: detail.name,
    taskMode: detail.taskMode,
    accountFilter: cloneFilter(detail.accountFilter),
    maxExecutingAccounts: detail.maxExecutingAccounts,
    maxUseAccounts: detail.maxUseAccounts,
    maxSendPerAccount: detail.maxSendPerAccount,
    cycleIntervalMinutes:
      detail.taskMode === "cycle" ? detail.cycleIntervalMinutes : 60,
    enabled: detail.enabled
  };
}

function normalizedPayload(
  form: HyperlinkStrategyForm
): HyperlinkStrategyPayload {
  return {
    name: form.name.trim(),
    taskMode: form.taskMode,
    accountFilter: normalizeAccountFilter(form.accountFilter),
    maxExecutingAccounts: form.maxExecutingAccounts,
    maxUseAccounts: form.maxUseAccounts,
    maxSendPerAccount: form.maxSendPerAccount,
    cycleIntervalMinutes:
      form.taskMode === "cycle" ? form.cycleIntervalMinutes : 0,
    enabled: form.enabled
  };
}

export function strategyCreatePayload(
  form: HyperlinkStrategyForm
): HyperlinkStrategyPayload {
  return normalizedPayload(form);
}

export function strategyUpdatePayload(
  form: HyperlinkStrategyForm
): HyperlinkStrategyUpdatePayload {
  if (form.version == null) throw new Error("策略版本缺失，请刷新后重试");
  return { ...normalizedPayload(form), version: form.version };
}

export function validateHyperlinkStrategyForm(
  form: HyperlinkStrategyForm
): string {
  const name = form.name.trim();
  if (!name) return "请填写策略名称";
  if (name.length > 128) return "策略名称不能超过 128 个字符";
  if (!["instant", "rolling", "cycle"].includes(form.taskMode)) {
    return "请选择任务模式";
  }
  if (
    !Number.isSafeInteger(form.maxExecutingAccounts) ||
    form.maxExecutingAccounts < 0 ||
    form.maxExecutingAccounts > 100
  ) {
    return "最大执行账号数须为 0～100 的整数，0 表示自动均分";
  }
  if (!Number.isSafeInteger(form.maxUseAccounts) || form.maxUseAccounts < 0) {
    return "最大使用账号数必须为非负整数";
  }
  if (form.taskMode === "cycle" && form.maxUseAccounts < 1) {
    return "周期策略的每轮最大账号数必须至少为 1";
  }
  if (
    form.maxUseAccounts > 0 &&
    form.maxExecutingAccounts > 0 &&
    form.maxExecutingAccounts > form.maxUseAccounts
  ) {
    return "最大执行账号数不能大于最大使用账号数";
  }
  if (
    !Number.isSafeInteger(form.maxSendPerAccount) ||
    form.maxSendPerAccount < 0
  ) {
    return "每账号最大发送数必须为非负整数";
  }
  if (
    form.taskMode === "cycle" &&
    (!Number.isSafeInteger(form.cycleIntervalMinutes) ||
      form.cycleIntervalMinutes < 30)
  ) {
    return "周期策略的执行间隔不能小于 30 分钟";
  }
  return validateAccountFilter(normalizeAccountFilter(form.accountFilter));
}

export function strategyTaskModeLabel(value: HyperlinkTaskMode): string {
  return (
    STRATEGY_TASK_MODES.find(item => item.value === value)?.label ??
    `未知类型 ${value}`
  );
}
