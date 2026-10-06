import type { StandardPullTaskCreateForm } from "./composables/useStandardPullTaskCreate";

const modeSettingKeys = [
  "creatorDeleteAfterTakeover",
  "groupSettingEnabled",
  "groupSettingTiming",
  "useMaterialFileNameAsGroupName",
  "earlyPullCount",
  "earlyPullCallCount",
  "pullCountMin",
  "pullCountMax",
  "pullIntervalSeconds",
  "pullIntervalMaxSeconds"
] as const;

export type StandardPullTaskModeSettings = Pick<
  StandardPullTaskCreateForm,
  (typeof modeSettingKeys)[number]
>;

export function captureModeSettings(
  form: StandardPullTaskCreateForm
): StandardPullTaskModeSettings {
  return Object.fromEntries(
    modeSettingKeys.map(key => [key, form[key]])
  ) as StandardPullTaskModeSettings;
}

export function requireNewGroupProfile(form: StandardPullTaskCreateForm): void {
  form.groupSettingEnabled = true;
  form.groupSettingTiming = "BEFORE_PULL";
  form.useMaterialFileNameAsGroupName = false;
  form.earlyPullCallCount = 0;
}

export function defaultNewGroupSettings(): StandardPullTaskModeSettings {
  return {
    creatorDeleteAfterTakeover: false,
    groupSettingEnabled: true,
    groupSettingTiming: "BEFORE_PULL",
    useMaterialFileNameAsGroupName: false,
    earlyPullCount: 1,
    earlyPullCallCount: 0,
    pullCountMin: 1,
    pullCountMax: 3,
    pullIntervalSeconds: 10,
    pullIntervalMaxSeconds: 15
  };
}

export function validateStandardProfileAndPullSettings(
  form: StandardPullTaskCreateForm
): string | null {
  const isNewGroup = form.creationMode === "NEW_GROUP";
  if (
    !Number.isInteger(form.pullCountMin) ||
    !Number.isInteger(form.pullCountMax) ||
    form.pullCountMin < 1 ||
    form.pullCountMax < form.pullCountMin ||
    (isNewGroup && form.pullCountMax > 3)
  ) {
    return isNewGroup
      ? "新群模式单次拉人数必须在 1–3 人范围内"
      : "单次拉人数范围配置不正确";
  }
  if (
    !Number.isInteger(form.pullIntervalSeconds) ||
    form.pullIntervalSeconds < 0 ||
    (isNewGroup &&
      (!Number.isInteger(form.pullIntervalMaxSeconds) ||
        form.pullIntervalSeconds < 10 ||
        form.pullIntervalMaxSeconds > 15 ||
        form.pullIntervalMaxSeconds < form.pullIntervalSeconds))
  ) {
    return isNewGroup
      ? "新群模式拉人间隔必须在 10–15 秒范围内"
      : "拉人间隔必须是非负整数";
  }
  if (
    !Number.isInteger(form.earlyPullCount) ||
    form.earlyPullCount < 1 ||
    !Number.isInteger(form.earlyPullCallCount) ||
    (isNewGroup ? form.earlyPullCallCount !== 0 : form.earlyPullCallCount < 1)
  ) {
    return isNewGroup
      ? "新群模式从首次调用起使用单次拉人数范围"
      : "前期拉人人数或执行次数配置不正确";
  }
  if (!isNewGroup) return null;
  if (!form.groupSettingEnabled || form.groupSettingTiming !== "BEFORE_PULL") {
    return "新群模式必须在群名称和群描述设置成功后开始拉人";
  }
  if (form.useMaterialFileNameAsGroupName) {
    return "新群模式请填写群名称，不能使用料子文件名";
  }
  if (!form.groupName.trim()) return "请填写群名称";
  if (form.groupName.trim().length > 100) return "群名称不能超过 100 个字符";
  if (!form.groupDescription.trim()) return "请填写群描述";
  if (form.groupDescription.trim().length > 1024) {
    return "群描述不能超过 1024 个字符";
  }
  return null;
}

export function formatPullInterval(
  minimumSeconds: number,
  maximumSeconds?: number | null
): string {
  const maximum = maximumSeconds ?? minimumSeconds;
  return maximum === minimumSeconds
    ? `${minimumSeconds} 秒`
    : `${minimumSeconds}–${maximum} 秒（随机）`;
}
