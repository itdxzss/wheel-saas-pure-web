import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const moduleUrl = new URL("./create-interactions.ts", import.meta.url);

describe("pull task GROUP_MARKETING create interactions", () => {
  it("preserves other-page selections and deduplicates ids", async () => {
    assert.ok(
      existsSync(fileURLToPath(moduleUrl)),
      "create-interactions.ts should exist"
    );
    const { reconcileSelectedGroupIds } = await import(moduleUrl.href);

    assert.deepEqual(
      reconcileSelectedGroupIds([1, 2, 8], [1, 2, 3], [2, 3]),
      [8, 2, 3]
    );
    assert.deepEqual(reconcileSelectedGroupIds([8, 2, 3], [1, 2, 3], []), [8]);
    assert.deepEqual(reconcileSelectedGroupIds([8, 8], [1, 2], [2, 2]), [8, 2]);
  });

  it("caps rates without limiting count thresholds", async () => {
    assert.ok(existsSync(fileURLToPath(moduleUrl)));
    const { normalizeThreshold, thresholdMaximum } = await import(
      moduleUrl.href
    );

    assert.equal(thresholdMaximum("RATE"), 100);
    assert.equal(thresholdMaximum("COUNT"), undefined);
    assert.equal(normalizeThreshold(140, "RATE"), 100);
    assert.equal(normalizeThreshold(140, "COUNT"), 140);
    assert.equal(normalizeThreshold(-1, "COUNT"), 0);
  });

  it("accepts only TXT targets and preserves the last valid file", async () => {
    assert.ok(existsSync(fileURLToPath(moduleUrl)));
    const { resolveTargetFileSelection } = await import(moduleUrl.href);
    const previous = { name: "previous.txt" };
    const valid = { name: "TARGETS.TXT" };
    const invalid = { name: "targets.txt.exe" };

    assert.deepEqual(resolveTargetFileSelection(previous, valid), {
      file: valid,
      warning: null
    });
    assert.deepEqual(resolveTargetFileSelection(previous, invalid), {
      file: previous,
      warning: "仅支持 TXT 文件"
    });
    assert.deepEqual(resolveTargetFileSelection(previous, null), {
      file: previous,
      warning: null
    });
  });

  it("blocks unconfirmed actions and returns to the pull task list", async () => {
    assert.ok(existsSync(fileURLToPath(moduleUrl)));
    const { PULL_TASK_LIST_ROUTE_NAME, notifyUnconfirmedCreateAction } =
      await import(moduleUrl.href);
    const notifications: string[] = [];

    notifyUnconfirmedCreateAction("创建并启动", message => {
      notifications.push(message);
    });

    assert.deepEqual(notifications, [
      "创建并启动接口契约待确认，当前仅完成前端配置"
    ]);
    assert.equal(PULL_TASK_LIST_ROUTE_NAME, "TaskPull");
  });

  it("validates required and conditional frontend-only fields", async () => {
    assert.ok(existsSync(fileURLToPath(moduleUrl)));
    const { validateCreateDraft } = await import(moduleUrl.href);
    const { createEmptyPullTaskMarketingDraft } = await import(
      new URL("./create-draft.ts", import.meta.url).href
    );
    const draft = createEmptyPullTaskMarketingDraft();

    assert.deepEqual(validateCreateDraft(draft), [
      "请填写任务名称",
      "请选择目标数据包或上传 TXT",
      "请选择至少一个目标群组",
      "请选择营销模板"
    ]);

    draft.taskName = "测试任务";
    draft.targetPackageId = 1;
    draft.selectedGroupIds = [9];
    draft.marketingTemplateId = 2;
    assert.deepEqual(validateCreateDraft(draft), []);

    draft.groupNameMode = "UNIFIED";
    assert.deepEqual(validateCreateDraft(draft), ["请填写统一群名称"]);
    draft.unifiedGroupName = "统一名称";
    draft.groupDescriptionMode = "UNIFIED";
    assert.deepEqual(validateCreateDraft(draft), ["请填写统一群描述"]);
    draft.unifiedGroupDescription = "统一描述";
    draft.startMode = "SCHEDULED";
    assert.deepEqual(validateCreateDraft(draft), ["请选择定时启动时间"]);
  });
});
