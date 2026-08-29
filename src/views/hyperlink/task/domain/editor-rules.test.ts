import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  HyperlinkStrategyOption,
  HyperlinkTaskDetail
} from "@/api/hyperlink-task";
import {
  createEmptyHyperlinkTaskForm,
  detailToHyperlinkTaskForm,
  createEmptyAccountFilter,
  importHyperlinkStrategy,
  normalizeAccountFilter,
  sanitizeMessageContent,
  suggestTaskNameFromDataPackage,
  shouldUseFinalReview,
  toHyperlinkTaskSaveRequest,
  validateAccountFilter,
  validateHyperlinkTaskForm,
  type HyperlinkValidationContext
} from "./editor-rules";

describe("hyperlink task editor rules", () => {
  it("creates competitor-aligned defaults", () => {
    const form = createEmptyHyperlinkTaskForm();
    assert.equal(form.messageType, 3);
    assert.deepEqual(
      [form.messageIntervalMinSeconds, form.messageIntervalMaxSeconds],
      [0.5, 0.7]
    );
    assert.equal(form.messageContent.buttons.length, 1);
    assert.equal(form.accountFilter.filterSchemaVersion, 1);
  });

  it("restores server-resolved public and hyperlink groups on init or clear", () => {
    assert.deepEqual(createEmptyAccountFilter([7, 8, 7]).groupIds, [7, 8]);
  });

  it("does not silently erase conflicting included and excluded countries", () => {
    const filter = createEmptyAccountFilter();
    filter.countryIso2s = [" br "];
    filter.excludeCountryIso2s = ["BR"];
    const normalized = normalizeAccountFilter(filter);
    assert.deepEqual(normalized.countryIso2s, ["BR"]);
    assert.deepEqual(normalized.excludeCountryIso2s, ["BR"]);
    assert.equal(
      validateAccountFilter(normalized),
      "国家包含与国家排除不能选择相同国家"
    );
    normalized.excludeCountryIso2s = ["CN"];
    assert.equal(validateAccountFilter(normalized), "");
  });

  it("normalizes custom register days to positive integers and rejects invalid text", () => {
    const filter = createEmptyAccountFilter();
    (filter as { registerDaysMin: unknown }).registerDaysMin = " 180 ";
    const normalized = normalizeAccountFilter(filter);
    assert.equal(normalized.registerDaysMin, 180);
    const form = createEmptyHyperlinkTaskForm();
    (form.accountFilter as { registerDaysMin: unknown }).registerDaysMin =
      " 180 ";
    assert.equal(
      toHyperlinkTaskSaveRequest(form, null).accountFilter.registerDaysMin,
      180
    );

    (filter as { registerDaysMin: unknown }).registerDaysMin = "1.5";
    const invalid = normalizeAccountFilter(filter);
    assert.equal(Number.isNaN(invalid.registerDaysMin), true);
    assert.equal(validateAccountFilter(invalid), "注册天数下限必须为正整数");
  });

  it("preserves zero as a real friend-count and retention lower bound", () => {
    const filter = createEmptyAccountFilter();
    filter.friendCountMin = 0;
    filter.retentionDaysMin = 0;
    const normalized = normalizeAccountFilter(filter);
    assert.equal(normalized.friendCountMin, 0);
    assert.equal(normalized.retentionDaysMin, 0);
  });

  it("requires seven-second review for every pure create only", () => {
    assert.equal(shouldUseFinalReview("create"), true);
    assert.equal(shouldUseFinalReview("edit"), false);
    assert.equal(shouldUseFinalReview("copy"), false);
    assert.equal(shouldUseFinalReview("view"), false);
  });

  it("uses the selected data package name as a non-destructive task-name suggestion", () => {
    assert.deepEqual(suggestTaskNameFromDataPackage("", "", "巴西受众"), {
      taskName: "巴西受众",
      suggestion: "巴西受众"
    });
    assert.deepEqual(
      suggestTaskNameFromDataPackage("巴西受众", "巴西受众", "欧洲受众"),
      { taskName: "欧洲受众", suggestion: "欧洲受众" }
    );
    assert.deepEqual(
      suggestTaskNameFromDataPackage("人工任务名", "巴西受众", "欧洲受众"),
      { taskName: "人工任务名", suggestion: "欧洲受众" }
    );
  });

  it("copies only configuration and clears the audience package", () => {
    const base = createEmptyHyperlinkTaskForm();
    const detail = {
      ...base,
      id: 88,
      editable: true,
      runStatus: 0,
      shortLinkEnabled: false,
      dataPackageName: "巴西料",
      dataPackageAvailable: true,
      dataPackageId: 9,
      taskName: "活动",
      version: 7,
      createdAt: 1,
      updatedAt: 2
    } satisfies HyperlinkTaskDetail;
    const copy = detailToHyperlinkTaskForm(detail, "copy");
    assert.equal(copy.taskName, "活动 副本");
    assert.equal(copy.dataPackageId, null);
    assert.equal(copy.version, null);
    assert.equal(copy.sourceTaskId, 88);
  });

  it("imports only the frozen strategy whitelist", () => {
    const form = createEmptyHyperlinkTaskForm();
    form.taskName = "保留名称";
    form.messageIntervalMinSeconds = 1.1;
    form.dataPackageId = 5;
    const strategy = {
      id: 1,
      name: "稳健",
      taskMode: "cycle",
      accountFilter: form.accountFilter,
      maxExecutingAccounts: 4,
      maxUseAccounts: 5,
      maxSendPerAccount: 100,
      cycleIntervalMinutes: 90
    } satisfies HyperlinkStrategyOption;
    const result = importHyperlinkStrategy(form, strategy);
    assert.equal(result.taskName, "保留名称");
    assert.equal(result.messageIntervalMinSeconds, 1.1);
    assert.equal(result.dataPackageId, 5);
    assert.equal(result.taskMode, "cycle");
    assert.equal(result.maxUseAccounts, 5);
  });

  it("clears inactive message fields only when building the wire request", () => {
    const form = createEmptyHyperlinkTaskForm();
    form.messageContent.linkDescription = "preserved while editing";
    form.messageContent.promotionLink = "https://example.com/old";
    form.messageContent.title = "标题";
    form.messageContent.buttons[0].displayText = "查看";
    form.messageContent.buttons[0].url = "https://example.com";
    const sanitized = sanitizeMessageContent(3, form.messageContent);
    assert.equal(
      form.messageContent.linkDescription,
      "preserved while editing"
    );
    assert.equal(sanitized.linkDescription, null);
    assert.equal(sanitized.buttons.length, 1);
  });

  it("normalizes save fields and enforces instant account availability", () => {
    const form = createEmptyHyperlinkTaskForm();
    form.taskName = " 任务 ";
    form.messageContent.title = "标题";
    form.messageContent.buttons[0].displayText = "查看";
    form.messageContent.buttons[0].url = "https://example.com/path";
    form.dataPackageId = 1;
    assert.equal(
      validateHyperlinkTaskForm(form, {
        mode: "create",
        createContext: {
          pricingMode: "NORMAL",
          priceCode: "P1",
          currencyCode: "USDT",
          referenceUnitPrice: 0.01,
          accountBalance: 1,
          giftBalance: 0,
          availableBalance: 1,
          protocolCount: 1,
          maxConcurrentNum: 15,
          accountSendConcurrency: 20,
          defaultSubTaskNum: 50,
          defaultAccountGroupIds: [7, 8],
          groupOptions: [{ value: 7, label: "public" }],
          countryOptions: [{ value: "BR", label: "巴西" }],
          channelOptions: [{ value: 1, label: "渠道 A" }],
          protocolOptions: [{ value: "web", label: "Web" }]
        },
        matchedAccountCount: 0,
        matchedMaxConcurrentNum: 15,
        matching: false,
        matchError: "",
        dataPackageAvailable: true
      }),
      "即时任务需要至少 1 个可用账号"
    );
    assert.equal(toHyperlinkTaskSaveRequest(form, "quote").taskName, "任务");
  });

  it("uses the latest match capacity and validates every numeric wire field", () => {
    const form = createEmptyHyperlinkTaskForm();
    form.taskName = "任务";
    form.messageContent.title = "标题";
    form.messageContent.buttons[0].displayText = "查看";
    form.messageContent.buttons[0].url = "https://example.com";
    form.enabled = false;
    form.maxExecutingAccounts = 11;
    const context: HyperlinkValidationContext = {
      mode: "create" as const,
      createContext: {
        pricingMode: "NORMAL" as const,
        priceCode: "P1",
        currencyCode: "USDT",
        referenceUnitPrice: 0.01,
        accountBalance: 1,
        giftBalance: 0,
        availableBalance: 1,
        protocolCount: 1,
        maxConcurrentNum: 99,
        accountSendConcurrency: 20 as const,
        defaultSubTaskNum: 50 as const,
        defaultAccountGroupIds: [],
        groupOptions: [],
        countryOptions: [],
        channelOptions: [],
        protocolOptions: []
      },
      matchedAccountCount: 1,
      matchedMaxConcurrentNum: 10,
      matching: false,
      matchError: "",
      dataPackageAvailable: true
    };
    assert.equal(
      validateHyperlinkTaskForm(form, context),
      "最大执行账号数不能超过 10"
    );
    form.maxExecutingAccounts = 10;
    form.maxUseAccounts = 1.2;
    assert.equal(
      validateHyperlinkTaskForm(form, context),
      "最大使用账号数必须为非负整数"
    );
    form.maxUseAccounts = 0;
    form.maxSendPerAccount = -1;
    assert.equal(
      validateHyperlinkTaskForm(form, context),
      "每账号最大发送数必须为非负整数"
    );
    form.maxSendPerAccount = 0;
    form.messageIntervalMinSeconds = 0.25;
    assert.match(validateHyperlinkTaskForm(form, context), /最多保留 1 位小数/);
    form.messageIntervalMinSeconds = 0.2;
    form.taskMode = "cycle";
    form.cycleIntervalMinutes = 1.5;
    assert.equal(
      validateHyperlinkTaskForm(form, context),
      "任务执行间隔必须为正整数分钟"
    );
    form.taskMode = "instant";
    form.startMode = "scheduled";
    form.delayMinutes = 0.5;
    assert.equal(
      validateHyperlinkTaskForm(form, context),
      "延迟时间必须为非负整数分钟"
    );
  });

  it("fails closed on unknown enabled match results and missing default groups", () => {
    const form = createEmptyHyperlinkTaskForm();
    form.taskName = "任务";
    form.messageContent.title = "标题";
    form.messageContent.buttons[0].displayText = "查看";
    form.messageContent.buttons[0].url = "https://example.com";
    form.dataPackageId = 1;
    const context: HyperlinkValidationContext = {
      mode: "create" as const,
      createContext: {
        pricingMode: "NORMAL" as const,
        priceCode: "P1",
        currencyCode: "USDT",
        referenceUnitPrice: 0,
        accountBalance: 0,
        giftBalance: 0,
        availableBalance: 0,
        protocolCount: 1,
        maxConcurrentNum: 15,
        accountSendConcurrency: 20 as const,
        defaultSubTaskNum: 50 as const,
        defaultAccountGroupIds: [7, 8],
        groupOptions: [],
        countryOptions: [],
        channelOptions: [],
        protocolOptions: []
      },
      matchedAccountCount: null,
      matchedMaxConcurrentNum: null,
      matching: false,
      matchError: "",
      dataPackageAvailable: true
    };
    assert.equal(
      validateHyperlinkTaskForm(form, context),
      "账号试算结果尚未就绪，请重新试算"
    );
    context.matchedAccountCount = 1;
    context.matchedMaxConcurrentNum = 15;
    context.createContext.defaultAccountGroupIds = [];
    assert.equal(
      validateHyperlinkTaskForm(form, context),
      "系统默认业务组尚未就绪，请联系管理员"
    );
    form.enabled = false;
    assert.equal(validateHyperlinkTaskForm(form, context), "");
  });

  it("limits link descriptions to 512 characters", () => {
    const form = createEmptyHyperlinkTaskForm();
    form.enabled = false;
    form.messageType = 1;
    form.taskName = "任务";
    form.messageContent.title = "标题";
    form.messageContent.linkDescription = "x".repeat(513);
    form.messageContent.promotionLink = "https://example.com";
    form.messageContent.content = "正文";
    assert.equal(
      validateHyperlinkTaskForm(form, {
        mode: "create",
        createContext: {
          pricingMode: "NORMAL",
          priceCode: "P1",
          currencyCode: "USDT",
          referenceUnitPrice: 0,
          accountBalance: 0,
          giftBalance: 0,
          availableBalance: 0,
          protocolCount: 0,
          maxConcurrentNum: 0,
          accountSendConcurrency: 20,
          defaultSubTaskNum: 50,
          defaultAccountGroupIds: [],
          groupOptions: [],
          countryOptions: [],
          channelOptions: [],
          protocolOptions: []
        },
        matchedAccountCount: null,
        matchedMaxConcurrentNum: null,
        matching: false,
        matchError: "",
        dataPackageAvailable: true
      }),
      "链接描述不能超过 512 个字符"
    );
  });
});
