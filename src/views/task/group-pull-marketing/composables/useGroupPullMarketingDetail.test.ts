import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMock,
  resetArmadaMockQueue
} from "@/api/__tests__/armada-test-double";
import {
  elementPlusCalls,
  resetElementPlusMock
} from "@/api/__tests__/element-plus-test-double";
import {
  parseGroupPullTaskId,
  useGroupPullMarketingDetail
} from "./useGroupPullMarketingDetail";

describe("group pull marketing detail page state", () => {
  it("accepts only one positive integer route task id", () => {
    assert.equal(parseGroupPullTaskId("8"), 8);
    assert.equal(parseGroupPullTaskId(["9"]), 9);
    assert.equal(parseGroupPullTaskId("0"), null);
    assert.equal(parseGroupPullTaskId("1.5"), null);
    assert.equal(parseGroupPullTaskId("abc"), null);
  });

  it("loads task, first group page and display options together", async () => {
    resetArmadaMockQueue([
      { id: 8, taskName: "任务" },
      { list: [{ executionId: 1 }], total: 1 },
      { list: [{ id: 11, name: "建群组" }], total: 1 },
      { list: [{ id: 21, templateName: "模板" }], total: 1 }
    ]);
    const page = useGroupPullMarketingDetail(8);

    await page.loadInitial();

    assert.equal(page.detail.value?.id, 8);
    assert.equal(page.groups.value[0]?.executionId, 1);
    assert.equal(page.total.value, 1);
    assert.equal(page.accountGroups.value[0]?.name, "建群组");
    assert.equal(page.marketingTemplates.value[0]?.templateName, "模板");
    assert.deepEqual(
      armadaCalls().map(call => call.url),
      [
        "/api/group-pull-marketing-tasks/8",
        "/api/group-pull-marketing-tasks/8/groups",
        "/api/account-groups",
        "/api/marketing-templates"
      ]
    );
  });

  it("reloads only group rows when pagination changes", async () => {
    resetArmadaMock({ list: [], total: 0 });
    const page = useGroupPullMarketingDetail(8);
    page.page.value = 2;
    page.pageSize.value = 20;

    await page.loadGroups();

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/group-pull-marketing-tasks/8/groups",
        opts: { params: { page: 2, pageSize: 20 } }
      }
    ]);
  });

  it("reloads the reused detail page when the route task id changes", async () => {
    resetArmadaMockQueue([
      { id: 8, taskName: "任务8" },
      { list: [{ executionId: 81 }], total: 1 },
      { list: [], total: 0 },
      { list: [], total: 0 },
      { id: 9, taskName: "任务9" },
      { list: [{ executionId: 91 }], total: 1 },
      { list: [], total: 0 },
      { list: [], total: 0 }
    ]);
    const state = useGroupPullMarketingDetail(8);

    await state.loadInitial();
    state.page.value = 3;
    await state.changeTaskId(9);

    assert.equal(state.detail.value?.id, 9);
    assert.equal(state.groups.value[0]?.executionId, 91);
    assert.equal(state.page.value, 1);
    assert.deepEqual(
      armadaCalls().map(call => call.url),
      [
        "/api/group-pull-marketing-tasks/8",
        "/api/group-pull-marketing-tasks/8/groups",
        "/api/account-groups",
        "/api/marketing-templates",
        "/api/group-pull-marketing-tasks/9",
        "/api/group-pull-marketing-tasks/9/groups",
        "/api/account-groups",
        "/api/marketing-templates"
      ]
    );
  });

  it("keeps core task data visible when a display dictionary fails", async () => {
    resetElementPlusMock();
    resetArmadaMockQueue([
      { id: 8, taskName: "任务" },
      { list: [{ executionId: 1 }], total: 1 },
      Promise.reject(new Error("账号分组接口异常")),
      { list: [{ id: 21, templateName: "模板" }], total: 1 }
    ]);
    const state = useGroupPullMarketingDetail(8);

    await state.loadInitial();

    assert.equal(state.detail.value?.id, 8);
    assert.equal(state.groups.value[0]?.executionId, 1);
    assert.deepEqual(state.accountGroups.value, []);
    assert.equal(state.marketingTemplates.value[0]?.templateName, "模板");
    assert.deepEqual(elementPlusCalls(), [
      { type: "warning", text: "部分名称加载失败，当前展示ID" }
    ]);
  });
});
