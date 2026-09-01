import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { HyperlinkTaskListItem } from "@/api/hyperlink-task-list";
import {
  accountFilterLabels,
  createHyperlinkTaskTableColumns,
  currentPageMetrics,
  currentUserTenantColumnKey,
  mergeColumnPreferences,
  rowActions,
  taskStatus,
  toColumnPreferences
} from "./list-display";

function row(
  runStatus: 0 | 1 | 2 | 3 | 4,
  overrides: Partial<HyperlinkTaskListItem> = {}
): HyperlinkTaskListItem {
  return {
    id: runStatus + 1,
    taskName: `任务${runStatus}`,
    messageType: 1,
    taskMode: "instant",
    enabled: true,
    runStatus,
    provisionStatus: "READY",
    shortLinkEnabled: true,
    version: 1,
    promotionLink: null,
    dataPackageId: 1,
    dataPackageName: "数据包",
    accountFilter: {
      filterSchemaVersion: 1,
      countryIso2s: [],
      excludeCountryIso2s: [],
      continent: null,
      groupIds: [],
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
      retentionDaysMin: null,
      retentionDaysMax: null,
      registerDaysMin: null,
      registerDaysMax: null,
      createdAtFrom: null,
      createdAtTo: null
    },
    targetCountryIso2s: ["BR"],
    plannedEndAt: null,
    cycleIntervalMinutes: 0,
    createdAt: 1,
    recipientTotal: 100,
    sendTotal: 90,
    successNum: 80,
    deliveredNum: 60,
    readNum: 20,
    failedNum: 10,
    unregisteredNum: 4,
    usedAccountCount: 8,
    invalidAccountCount: 2,
    clickUvNum: 20,
    clickTotal: 30,
    actualConcurrency: 5,
    executionDurationSec: 100,
    metricsUpdatedAt: 1,
    ...overrides
  };
}

describe("hyperlink task H1 list display", () => {
  it("defines all fifteen logical columns and keeps fixed columns visible", () => {
    const defaults = createHyperlinkTaskTableColumns();
    assert.equal(defaults.length, 15);
    assert.deepEqual(
      defaults.map(column => column.label),
      [
        "ID",
        "任务名称",
        "数据包",
        "账号范围",
        "营销目标国家",
        "状态",
        "账号统计",
        "进度",
        "双钩数/双钩率",
        "点击 UV/点击率",
        "最大执行账号数",
        "已执行时长",
        "结束/周期",
        "创建时间",
        "操作"
      ]
    );
    const merged = mergeColumnPreferences(defaults, [
      { prop: "id", hide: true },
      { prop: "taskName", hide: true },
      { prop: "removed-column", hide: true }
    ]);
    assert.equal(merged.find(column => column.prop === "id")?.hide, false);
    assert.equal(merged.find(column => column.prop === "taskName")?.hide, true);
    assert.equal(merged.find(column => column.prop === "click")?.hide, true);
    assert.equal(toColumnPreferences(merged).length, 15);
  });

  it("computes six cards from the current page and excludes untracked success from click rate", () => {
    const metrics = currentPageMetrics([
      row(1),
      row(2, {
        shortLinkEnabled: false,
        recipientTotal: 50,
        successNum: 50,
        deliveredNum: 25,
        clickUvNum: 49
      })
    ]);
    assert.deepEqual(metrics, {
      taskCount: 2,
      recipientTotal: 150,
      successNum: 130,
      deliveredNum: 85,
      deliveryRate: "65.38%",
      clickUvNum: 20,
      clickRate: "25.00%"
    });
  });

  it("freezes the five-state action matrix without delete", () => {
    assert.deepEqual(rowActions(row(0)), ["START", "EDIT", "DETAIL", "COPY"]);
    assert.deepEqual(rowActions(row(1)), [
      "PAUSE",
      "STOP",
      "VIEW",
      "DETAIL",
      "COPY"
    ]);
    assert.deepEqual(rowActions(row(2)), ["VIEW", "DETAIL", "COPY"]);
    assert.deepEqual(rowActions(row(3)), [
      "RESUME",
      "STOP",
      "VIEW",
      "DETAIL",
      "COPY"
    ]);
    assert.deepEqual(rowActions(row(4)), ["VIEW", "DETAIL", "COPY"]);
    assert.equal(rowActions(row(1)).includes("DELETE" as never), false);
  });

  it("shows preparation states and blocks lifecycle actions until ready", () => {
    const processing = row(0, { provisionStatus: "PROCESSING" });
    const failed = row(0, { provisionStatus: "FAILED" });

    assert.deepEqual(taskStatus(processing), {
      label: "准备中",
      type: "warning"
    });
    assert.deepEqual(rowActions(processing), ["VIEW"]);
    assert.deepEqual(taskStatus(failed), {
      label: "准备失败",
      type: "danger"
    });
    assert.deepEqual(rowActions(failed), ["EDIT", "VIEW", "COPY"]);
  });

  it("renders every account filter family with stable unknown fallbacks", () => {
    const labels = accountFilterLabels({
      ...row(0).accountFilter,
      countryIso2s: ["BR"],
      excludeCountryIso2s: ["CN"],
      continent: "SA",
      groupIds: [1],
      channelIds: [2],
      protocolId: "web",
      onlineStatus: "ONLINE",
      rotationStatus: 9,
      accountType: 2,
      platform: "ANDROID_PERSONAL",
      widType: "web5",
      importMode: "six_segment",
      groupInviteAllowed: true,
      phone: "551",
      importBatchId: 8,
      source: 4,
      friendCountMin: 1,
      friendCountMax: 10,
      retentionDaysMin: 2,
      retentionDaysMax: 20,
      registerDaysMin: 3,
      registerDaysMax: 30,
      createdAtFrom: 4,
      createdAtTo: 40
    });
    for (const family of [
      "包含国家",
      "排除国家",
      "大洲",
      "业务组",
      "渠道",
      "协议",
      "在线状态",
      "轮转状态：未知(9)",
      "账号类型",
      "平台",
      "设备类型",
      "导入方式",
      "允许拉群",
      "手机号",
      "导入批次",
      "来源",
      "好友数",
      "存活天数",
      "注册天数",
      "入库时间"
    ]) {
      assert.ok(
        labels.some(label => label.includes(family)),
        family
      );
    }
  });

  it("scopes column persistence to the current user-session without exposing the token", () => {
    const key = currentUserTenantColumnKey("operator", "tenant-scoped-secret");
    assert.match(key, /^hyperlink-task-list-columns:v2:operator:/);
    assert.doesNotMatch(key, /tenant-scoped-secret/);
  });
});
