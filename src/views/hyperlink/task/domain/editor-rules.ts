import type {
  HyperlinkAccountFilter,
  HyperlinkEditorMode,
  HyperlinkMessageContent,
  HyperlinkMessageType,
  HyperlinkStrategyOption,
  HyperlinkTaskCreateContext,
  HyperlinkTaskDetail,
  HyperlinkTaskSaveRequest
} from "@/api/hyperlink-task";
import type { HyperlinkTemplateDetail } from "@/api/hyperlink-template";

export type HyperlinkTaskForm = HyperlinkTaskSaveRequest;

export interface HyperlinkValidationContext {
  mode: HyperlinkEditorMode;
  createContext: HyperlinkTaskCreateContext | null;
  matchedAccountCount: number | null;
  matchedMaxConcurrentNum: number | null;
  matching: boolean;
  matchError: string;
  dataPackageAvailable: boolean;
}

export const MESSAGE_TYPE_OPTIONS: Array<{
  value: Exclude<HyperlinkMessageType, 2>;
  label: string;
}> = [
  { value: 3, label: "普通按钮" },
  { value: 4, label: "卡片按钮" },
  { value: 1, label: "单图文" }
];

/** 竞品仅按打开模式判断：所有纯新建都核对 7 秒，是否启用不改变该门禁。 */
export function shouldUseFinalReview(mode: HyperlinkEditorMode): boolean {
  return mode === "create";
}

export function createEmptyAccountFilter(
  defaultGroupIds: number[] = []
): HyperlinkAccountFilter {
  return {
    filterSchemaVersion: 1,
    countryIso2s: [],
    excludeCountryIso2s: [],
    continent: null,
    groupIds: [...new Set(defaultGroupIds)],
    channelIds: [],
    protocolId: null,
    onlineStatus: null,
    rotationStatus: null,
    accountType: null,
    platform: null,
    widType: null,
    importMode: null,
    groupInviteAllowed: null,
    phone: null,
    importBatchId: null,
    source: null,
    friendCountMin: null,
    friendCountMax: null,
    contactNamedNumMin: null,
    contactNamedNumMax: null,
    retentionDaysMin: null,
    retentionDaysMax: null,
    registerDaysMin: null,
    registerDaysMax: null,
    createdAtFrom: null,
    createdAtTo: null
  };
}

export function createEmptyMessageContent(): HyperlinkMessageContent {
  return {
    linkPreviewAssetId: null,
    title: "",
    linkDescription: null,
    promotionLink: null,
    bodyMainAssetId: null,
    content: null,
    cardText: null,
    buttons: [
      {
        type: "CTA_URL",
        displayText: "",
        url: "",
        useShortLink: false
      }
    ]
  };
}

export function createEmptyHyperlinkTaskForm(): HyperlinkTaskForm {
  return {
    version: null,
    sourceTaskId: null,
    taskName: "",
    messageType: 3,
    messageContent: createEmptyMessageContent(),
    taskMode: "instant",
    plannedEndAt: null,
    cycleIntervalMinutes: 60,
    accountFilter: createEmptyAccountFilter(),
    messageIntervalMinSeconds: 0.5,
    messageIntervalMaxSeconds: 0.7,
    maxExecutingAccounts: 10,
    maxUseAccounts: 0,
    maxSendPerAccount: 0,
    startMode: "now",
    delayMinutes: 0,
    dataPackageId: null,
    enabled: true,
    quoteToken: null
  };
}

export function suggestTaskNameFromDataPackage(
  currentTaskName: string,
  previousSuggestion: string,
  dataPackageName: string
): { taskName: string; suggestion: string } {
  const current = currentTaskName.trim();
  const suggestion = dataPackageName.trim();
  return {
    taskName:
      !current || current === previousSuggestion.trim()
        ? suggestion
        : currentTaskName,
    suggestion
  };
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function detailToHyperlinkTaskForm(
  detail: HyperlinkTaskDetail,
  mode: HyperlinkEditorMode
): HyperlinkTaskForm {
  const form = deepClone<HyperlinkTaskForm>({
    version: detail.version,
    sourceTaskId: null,
    taskName: detail.taskName,
    messageType: detail.messageType,
    messageContent: detail.messageContent,
    taskMode: detail.taskMode,
    plannedEndAt: detail.plannedEndAt,
    cycleIntervalMinutes: detail.cycleIntervalMinutes,
    accountFilter: detail.accountFilter,
    messageIntervalMinSeconds: detail.messageIntervalMinSeconds,
    messageIntervalMaxSeconds: detail.messageIntervalMaxSeconds,
    maxExecutingAccounts: detail.maxExecutingAccounts,
    maxUseAccounts: detail.maxUseAccounts,
    maxSendPerAccount: detail.maxSendPerAccount,
    startMode: detail.startMode,
    delayMinutes: detail.delayMinutes,
    dataPackageId: detail.dataPackageId,
    enabled: detail.enabled,
    quoteToken: null
  });
  if (mode === "copy") {
    form.version = null;
    form.sourceTaskId = detail.id;
    form.taskName = `${detail.taskName.trim()} 副本`.trim();
    form.dataPackageId = null;
  }
  return form;
}

function trimmedOrNull(value: string | null): string | null {
  return value?.trim() || null;
}

function uniqueNumbers(values: number[]): number[] {
  return [
    ...new Set(values.filter(value => Number.isInteger(value) && value > 0))
  ];
}

function positiveIntegerInput(value: unknown): number | null {
  if (value == null || value === "") return null;
  const text = typeof value === "string" ? value.trim() : value;
  if (text === "") return null;
  const parsed = typeof text === "number" ? text : Number(text);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : Number.NaN;
}

export function normalizeAccountFilter(
  value: HyperlinkAccountFilter
): HyperlinkAccountFilter {
  const countries = [
    ...new Set(
      value.countryIso2s.map(item => item.trim().toUpperCase()).filter(Boolean)
    )
  ];
  const excluded = [
    ...new Set(
      value.excludeCountryIso2s
        .map(item => item.trim().toUpperCase())
        .filter(Boolean)
    )
  ];
  const nonNegativeOrNull = (input: number | null): number | null =>
    input != null && Number.isFinite(input) && input >= 0 ? input : null;
  const positiveOrNull = (input: number | null): number | null =>
    input != null && Number.isFinite(input) && input > 0 ? input : null;
  return {
    ...deepClone(value),
    filterSchemaVersion: 1,
    countryIso2s: countries,
    excludeCountryIso2s: excluded,
    groupIds: uniqueNumbers(value.groupIds),
    channelIds: uniqueNumbers(value.channelIds),
    continent: trimmedOrNull(value.continent),
    protocolId: trimmedOrNull(value.protocolId),
    phone: trimmedOrNull(value.phone),
    importBatchId: positiveOrNull(value.importBatchId),
    friendCountMin: nonNegativeOrNull(value.friendCountMin),
    friendCountMax: nonNegativeOrNull(value.friendCountMax),
    retentionDaysMin: nonNegativeOrNull(value.retentionDaysMin),
    retentionDaysMax: nonNegativeOrNull(value.retentionDaysMax),
    registerDaysMin: positiveIntegerInput(value.registerDaysMin),
    registerDaysMax: positiveIntegerInput(value.registerDaysMax),
    createdAtFrom: value.createdAtFrom,
    createdAtTo: value.createdAtTo
  };
}

export function importHyperlinkTemplate(
  form: HyperlinkTaskForm,
  template: HyperlinkTemplateDetail
): HyperlinkTaskForm {
  const next = deepClone(form);
  next.messageType = template.messageType;
  next.messageContent = {
    linkPreviewAssetId: template.linkPreviewAssetId,
    title: template.title,
    linkDescription: template.linkDescription,
    promotionLink: template.promotionLink,
    bodyMainAssetId: template.bodyMainAssetId,
    content: template.content,
    cardText: template.cardText,
    buttons: template.buttons.map(button => ({
      type: "CTA_URL",
      displayText: button.displayText,
      url: button.targetValue,
      useShortLink: button.useShortLink
    }))
  };
  return next;
}

export function importHyperlinkStrategy(
  form: HyperlinkTaskForm,
  strategy: HyperlinkStrategyOption
): HyperlinkTaskForm {
  const next = deepClone(form);
  next.taskMode = strategy.taskMode;
  next.accountFilter = normalizeAccountFilter(strategy.accountFilter);
  next.maxExecutingAccounts = strategy.maxExecutingAccounts;
  next.maxUseAccounts = strategy.maxUseAccounts;
  next.maxSendPerAccount = strategy.maxSendPerAccount;
  next.cycleIntervalMinutes = strategy.cycleIntervalMinutes;
  return next;
}

export function sanitizeMessageContent(
  type: HyperlinkMessageType,
  content: HyperlinkMessageContent
): HyperlinkMessageContent {
  const next = deepClone(content);
  next.title = next.title.trim();
  next.content = trimmedOrNull(next.content);
  if (type === 1 || type === 2) {
    next.linkDescription = trimmedOrNull(next.linkDescription);
    next.promotionLink = trimmedOrNull(next.promotionLink);
    next.bodyMainAssetId = type === 1 ? null : next.bodyMainAssetId;
    next.cardText = null;
    next.buttons = [];
    return next;
  }
  next.linkPreviewAssetId = null;
  next.linkDescription = null;
  next.promotionLink = null;
  next.cardText = type === 4 ? trimmedOrNull(next.cardText) : null;
  next.buttons = next.buttons.slice(0, 1).map(button => ({
    type: "CTA_URL",
    displayText: button.displayText.trim(),
    url: button.url.trim(),
    useShortLink: Boolean(button.useShortLink)
  }));
  return next;
}

export function toHyperlinkTaskSaveRequest(
  form: HyperlinkTaskForm,
  quoteToken: string | null
): HyperlinkTaskSaveRequest {
  return {
    ...deepClone(form),
    taskName: form.taskName.trim(),
    messageContent: sanitizeMessageContent(
      form.messageType,
      form.messageContent
    ),
    plannedEndAt: form.taskMode === "rolling" ? form.plannedEndAt : null,
    cycleIntervalMinutes:
      form.taskMode === "cycle" ? form.cycleIntervalMinutes : 60,
    accountFilter: normalizeAccountFilter(form.accountFilter),
    messageIntervalMinSeconds: form.messageIntervalMinSeconds,
    messageIntervalMaxSeconds: form.messageIntervalMaxSeconds,
    delayMinutes: form.startMode === "scheduled" ? form.delayMinutes : 0,
    quoteToken
  };
}

export function isAbsoluteHttpUrl(value: string): boolean {
  if (/^[\s\S]*[\u0000-\u001f\u007f][\s\S]*$/.test(value)) return false;
  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

function rangeError(
  min: number | null,
  max: number | null,
  label: string
): string {
  return min != null && max != null && min > max
    ? `${label}上限不得小于下限`
    : "";
}

export function validateAccountFilter(filter: HyperlinkAccountFilter): string {
  const countries = new Set(
    filter.countryIso2s.map(item => item.toUpperCase())
  );
  if (
    filter.excludeCountryIso2s.some(item => countries.has(item.toUpperCase()))
  ) {
    return "国家包含与国家排除不能选择相同国家";
  }
  for (const [value, label] of [
    [filter.registerDaysMin, "注册天数下限"],
    [filter.registerDaysMax, "注册天数上限"]
  ] as const) {
    if (value != null && (!Number.isSafeInteger(value) || value < 1)) {
      return `${label}必须为正整数`;
    }
  }
  return (
    rangeError(filter.friendCountMin, filter.friendCountMax, "双向好友数") ||
    rangeError(filter.retentionDaysMin, filter.retentionDaysMax, "存活天数") ||
    rangeError(filter.registerDaysMin, filter.registerDaysMax, "注册天数") ||
    (filter.createdAtFrom != null &&
    filter.createdAtTo != null &&
    filter.createdAtFrom >= filter.createdAtTo
      ? "入库时间范围无效"
      : "")
  );
}

function required(value: string | null, label: string, max: number): string {
  const text = value?.trim() ?? "";
  if (!text) return `请填写${label}`;
  return text.length > max ? `${label}不能超过 ${max} 个字符` : "";
}

export function validateHyperlinkTaskForm(
  form: HyperlinkTaskForm,
  context: HyperlinkValidationContext
): string {
  if (context.mode === "view") return "";
  if (!context.createContext) return "创建上下文尚未加载，请重试";
  if (
    (context.mode === "create" || context.mode === "copy") &&
    form.messageType === 2
  ) {
    return "双图文仅支持历史任务回显";
  }
  const taskName = required(form.taskName, "任务名称", 128);
  if (taskName) return taskName;
  const title = required(form.messageContent.title, "消息标题", 1024);
  if (title) return title;

  if (form.messageType === 1 || form.messageType === 2) {
    const description = required(
      form.messageContent.linkDescription,
      "链接描述",
      512
    );
    if (description) return description;
    const promotion = required(
      form.messageContent.promotionLink,
      "推广链接",
      2048
    );
    if (promotion) return promotion;
    if (!isAbsoluteHttpUrl(form.messageContent.promotionLink ?? "")) {
      return "请输入合法的 http/https 推广链接";
    }
    const content = required(form.messageContent.content, "正文", 2000);
    if (content) return content;
  } else {
    if ((form.messageContent.content?.trim().length ?? 0) > 200) {
      return "底部小字不能超过 200 个字符";
    }
    if (form.messageType === 4) {
      const card = required(form.messageContent.cardText, "卡片正文", 500);
      if (card) return card;
    }
    if (form.messageContent.buttons.length !== 1) return "请添加 1 个消息按钮";
    const button = form.messageContent.buttons[0];
    const buttonText = required(button.displayText, "按钮文字", 30);
    if (buttonText) return buttonText;
    const buttonUrl = required(button.url, "按钮跳转链接", 2048);
    if (buttonUrl) return buttonUrl;
    if (!isAbsoluteHttpUrl(button.url))
      return "请输入合法的 http/https 按钮链接";
  }

  if (form.taskMode === "rolling") {
    if (form.plannedEndAt == null || form.plannedEndAt < Date.now() + 60_000) {
      return "计划结束时间至少晚于当前时间 1 分钟";
    }
  }
  if (
    form.taskMode === "cycle" &&
    (!Number.isSafeInteger(form.cycleIntervalMinutes) ||
      form.cycleIntervalMinutes < 1)
  ) {
    return "任务执行间隔必须为正整数分钟";
  }
  const filterError = validateAccountFilter(form.accountFilter);
  if (filterError) return filterError;
  if (
    !Number.isFinite(form.messageIntervalMinSeconds) ||
    !Number.isFinite(form.messageIntervalMaxSeconds) ||
    form.messageIntervalMinSeconds < 0 ||
    form.messageIntervalMaxSeconds > 10 ||
    form.messageIntervalMinSeconds > form.messageIntervalMaxSeconds ||
    !Number.isInteger(form.messageIntervalMinSeconds * 10) ||
    !Number.isInteger(form.messageIntervalMaxSeconds * 10)
  ) {
    return "消息间隔须在 0～10 秒、最小值不大于最大值且最多保留 1 位小数";
  }
  if (
    !Number.isSafeInteger(form.maxExecutingAccounts) ||
    form.maxExecutingAccounts < 1
  ) {
    return "最大执行账号数必须为正整数";
  }
  if (!Number.isSafeInteger(form.maxUseAccounts) || form.maxUseAccounts < 0) {
    return "最大使用账号数必须为非负整数";
  }
  if (
    !Number.isSafeInteger(form.maxSendPerAccount) ||
    form.maxSendPerAccount < 0
  ) {
    return "每账号最大发送数必须为非负整数";
  }
  if (
    form.startMode === "scheduled" &&
    (!Number.isSafeInteger(form.delayMinutes) || form.delayMinutes < 0)
  ) {
    return "延迟时间必须为非负整数分钟";
  }
  const createContext = context.createContext;
  if (form.enabled && createContext.defaultAccountGroupIds.length < 2) {
    return "系统默认业务组尚未就绪，请联系管理员";
  }
  const maxConcurrentNum =
    context.matchedMaxConcurrentNum ?? createContext.maxConcurrentNum;
  if (form.maxExecutingAccounts > maxConcurrentNum) {
    return `最大执行账号数不能超过 ${maxConcurrentNum}`;
  }
  if (createContext && 20 * form.maxExecutingAccounts > 10_000) {
    return "最大执行账号数超出系统单任务并发上限";
  }
  if (
    form.maxUseAccounts > 0 &&
    form.maxExecutingAccounts > form.maxUseAccounts
  ) {
    return "最大执行账号数不能大于最大使用账号数";
  }
  if (form.taskMode === "cycle" && form.maxUseAccounts < 1) {
    return "周期模式每轮最大账号数必须大于等于 1";
  }
  if (form.startMode === "scheduled" && form.enabled && form.delayMinutes < 1) {
    return "延后执行时请填写延迟分钟数";
  }
  if (form.enabled && form.dataPackageId == null)
    return "启用任务时必须选择受众数据包";
  if (form.enabled && !context.dataPackageAvailable)
    return "当前数据包已不可用，请重新选择";
  if (form.enabled && createContext?.protocolCount === 0)
    return "当前没有可用协议，不能启用任务";
  if (
    form.enabled &&
    (context.matching ||
      context.matchError ||
      context.matchedAccountCount == null)
  ) {
    return context.matching
      ? "账号数正在试算，请稍候"
      : context.matchError
        ? "账号试算失败，请重新试算"
        : "账号试算结果尚未就绪，请重新试算";
  }
  if (
    form.enabled &&
    form.taskMode === "instant" &&
    context.matchedAccountCount === 0
  ) {
    return "即时任务需要至少 1 个可用账号";
  }
  return "";
}

export function accountFilterSummary(filter: HyperlinkAccountFilter): string[] {
  const items: string[] = [];
  if (filter.groupIds.length) items.push(`分组 ${filter.groupIds.length}`);
  if (filter.continent) items.push(`大洲 ${filter.continent}`);
  if (filter.countryIso2s.length)
    items.push(`包含国家 ${filter.countryIso2s.length}`);
  if (filter.excludeCountryIso2s.length)
    items.push(`排除国家 ${filter.excludeCountryIso2s.length}`);
  if (filter.phone) items.push(`手机号 ${filter.phone}`);
  if (filter.onlineStatus)
    items.push(filter.onlineStatus === "ONLINE" ? "在线" : "离线");
  if (filter.protocolId) items.push(`协议 ${filter.protocolId}`);
  if (filter.channelIds.length) items.push(`渠道 ${filter.channelIds.length}`);
  return items;
}
