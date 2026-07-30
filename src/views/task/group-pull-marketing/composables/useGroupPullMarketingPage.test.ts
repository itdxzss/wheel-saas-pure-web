import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMockQueue
} from "@/api/__tests__/armada-test-double";
import {
  elementPlusCalls,
  resetElementPlusMock
} from "@/api/__tests__/element-plus-test-double";
import type { AccountGroupApiRow } from "@/api/account-group";
import { useGroupPullMarketingPage } from "./useGroupPullMarketingPage";

function group(
  id: number,
  onlineAccounts = 1,
  marketingOccupancyTaskId: number | null = null
): AccountGroupApiRow {
  return {
    id,
    name: `分组${id}`,
    totalAccounts: 2,
    onlineAccounts,
    abnormalAccounts: 0,
    bannedAccounts: 0,
    updatedAt: "",
    systemBuiltin: false,
    marketingOccupancyTaskId
  };
}

describe("group pull marketing page state", () => {
  it("uses confirmed defaults and replaces the only material file", () => {
    resetElementPlusMock();
    const page = useGroupPullMarketingPage();
    const first = new File(["1"], "a.txt");
    const second = new File(["2"], "b.csv");

    assert.equal(page.createForm.marketingAccountGroupLimit, 10);
    assert.equal(page.createForm.sendIntervalSeconds, 30);
    assert.equal(page.createForm.friendRetryLimit, 3);
    assert.equal(page.createForm.materialPerGroup, 3);
    assert.equal(page.createForm.materialEntryIntervalMinutes, 5);
    assert.equal(page.createForm.speakPermission, 1);
    assert.equal(page.createForm.builderExitEnabled, true);
    assert.equal(new Date(Number(page.createForm.taskEndAt)).getHours(), 23);

    assert.equal(page.selectMaterialFile(first), true);
    assert.equal(page.selectMaterialFile(second), true);
    assert.equal(page.materialFile.value?.name, "b.csv");
    assert.equal(page.selectMaterialFile(new File(["3"], "c.xlsx")), false);
    assert.equal(page.materialFile.value?.name, "b.csv");
    assert.deepEqual(elementPlusCalls(), [
      { type: "warning", text: "料子文件仅支持 TXT、CSV 格式" }
    ]);
  });

  it("validates material entry interval as one to sixty whole minutes", () => {
    const page = useGroupPullMarketingPage();
    page.accountGroups.value = [group(1), group(2)];
    Object.assign(page.createForm, {
      taskName: "拉群任务",
      builderGroupId: 1,
      marketingGroupId: 2,
      marketingTemplateId: 9,
      taskEndAt: Date.now() + 60_000
    });

    page.createForm.materialEntryIntervalMinutes = 0;
    assert.equal(page.createBlockReason.value, "拉料间隔必须是1到60的整数分钟");
    page.createForm.materialEntryIntervalMinutes = 61;
    assert.equal(page.createBlockReason.value, "拉料间隔必须是1到60的整数分钟");
    page.createForm.materialEntryIntervalMinutes = 1.5;
    assert.equal(page.createBlockReason.value, "拉料间隔必须是1到60的整数分钟");
    page.createForm.materialEntryIntervalMinutes = 5;
    assert.equal(page.createBlockReason.value, "请选择TXT或CSV料子文件");
  });

  it("validates group relationships, usable accounts and integer settings", () => {
    const page = useGroupPullMarketingPage();
    page.accountGroups.value = [group(1), group(2, 0), group(3, 1, 99)];

    assert.equal(page.createBlockReason.value, "请填写任务名称");
    page.createForm.taskName = "拉群任务";
    assert.equal(page.createBlockReason.value, "请选择建群账号分组");
    page.createForm.builderGroupId = 1;
    page.createForm.marketingGroupId = 1;
    assert.equal(
      page.createBlockReason.value,
      "建群账号分组和营销分组不能相同"
    );
    page.createForm.marketingGroupId = 2;
    assert.equal(page.createBlockReason.value, "营销分组没有正常在线账号");
    page.createForm.marketingGroupId = 3;
    page.createForm.successGroupId = 3;
    assert.equal(
      page.createBlockReason.value,
      "该分组正在任务中使用，不能选择"
    );
    page.createForm.successGroupId = "";
    page.createForm.marketingAccountGroupLimit = 1.5;
    assert.equal(
      page.createBlockReason.value,
      "单营销账号最大群组数必须是大于等于1的整数"
    );
    page.createForm.marketingAccountGroupLimit = 10;
    page.createForm.marketingTemplateId = 9;
    page.createForm.groupNamePrefix = "群".repeat(101);
    assert.equal(page.createBlockReason.value, "群名前缀不能超过100个字符");
  });

  it("saves as pending without starting and refreshes the task list", async () => {
    resetElementPlusMock();
    resetArmadaMockQueue([{ id: 100 }, { list: [], total: 0 }]);
    const page = useGroupPullMarketingPage();
    page.accountGroups.value = [group(1), group(2)];
    page.createDrawerOpen.value = true;
    Object.assign(page.createForm, {
      taskName: " 拉群任务 ",
      builderGroupId: 1,
      marketingGroupId: 2,
      marketingTemplateId: 10,
      taskEndAt: Date.now() + 60_000
    });
    page.selectMaterialFile(new File(["8613900000000"], "data.txt"));

    await page.submitCreate();

    assert.deepEqual(
      armadaCalls().map(call => [call.method, call.url]),
      [
        ["post", "/api/group-pull-marketing-tasks"],
        ["get", "/api/group-pull-marketing-tasks"]
      ]
    );
    assert.equal(page.createDrawerOpen.value, false);
    assert.equal(page.materialFile.value, null);
    const createFormData = (armadaCalls()[0].opts as { data: FormData }).data;
    const configPart = createFormData.get("config");
    assert.ok(configPart instanceof Blob);
    assert.equal(
      JSON.parse(await configPart.text()).materialEntryIntervalSeconds,
      300
    );
    assert.deepEqual(elementPlusCalls(), [
      { type: "success", text: "拉群营销任务已保存，当前为待启动" }
    ]);
  });

  it("queries trimmed filters and refreshes after lifecycle actions", async () => {
    resetElementPlusMock();
    resetArmadaMockQueue([{ list: [], total: 0 }, {}, { list: [], total: 0 }]);
    const page = useGroupPullMarketingPage();
    page.page.value = 4;
    page.searchForm.id = "8";
    page.searchForm.keyword = "  七月  ";
    page.searchForm.status = 2;

    page.searchTasks();
    await new Promise(resolve => setTimeout(resolve, 0));
    await page.startTask({ id: 8 } as never);

    assert.equal(page.page.value, 1);
    assert.deepEqual(armadaCalls()[0], {
      method: "get",
      url: "/api/group-pull-marketing-tasks",
      opts: {
        params: {
          page: 1,
          pageSize: 10,
          id: 8,
          keyword: "七月",
          status: 2,
          blockReason: undefined,
          resourceStatus: undefined
        }
      }
    });
    assert.deepEqual(
      armadaCalls()
        .slice(1)
        .map(call => [call.method, call.url]),
      [
        ["post", "/api/group-pull-marketing-tasks/8/start"],
        ["get", "/api/group-pull-marketing-tasks"]
      ]
    );
  });
});
