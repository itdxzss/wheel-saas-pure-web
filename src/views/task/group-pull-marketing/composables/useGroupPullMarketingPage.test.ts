import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMock,
  resetArmadaMockFailure,
  resetArmadaMockQueue
} from "@/api/__tests__/armada-test-double";
import {
  elementPlusCalls,
  resetElementPlusMock
} from "@/api/__tests__/element-plus-test-double";
import { useGroupPullMarketingPage } from "./useGroupPullMarketingPage";

describe("group pull marketing page state", () => {
  it("queries all filters and refreshes after lifecycle actions", async () => {
    resetElementPlusMock();
    resetArmadaMockQueue([{ list: [], total: 0 }, {}, { list: [], total: 0 }]);
    const page = useGroupPullMarketingPage();
    page.page.value = 4;
    page.searchForm.id = "8";
    page.searchForm.keyword = "  七月  ";
    page.searchForm.status = 2;
    page.searchForm.blockReason = 4;
    page.searchForm.resourceStatus = 2;

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
          blockReason: 4,
          resourceStatus: 2
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

  it("resets all five filters before reloading", async () => {
    resetArmadaMock({ list: [], total: 0 });
    const page = useGroupPullMarketingPage();
    Object.assign(page.searchForm, {
      id: "8",
      keyword: "七月",
      status: 2,
      blockReason: 4,
      resourceStatus: 2
    });
    page.page.value = 3;

    page.resetSearchForm();
    await new Promise(resolve => setTimeout(resolve, 0));

    assert.equal(page.page.value, 1);
    assert.deepEqual(
      { ...page.searchForm },
      {
        id: "",
        keyword: "",
        status: "",
        blockReason: "",
        resourceStatus: ""
      }
    );
  });

  it("keeps the last successful rows when a refresh fails", async () => {
    resetElementPlusMock();
    resetArmadaMock({
      list: [
        {
          id: 8,
          taskName: "已加载任务",
          status: 2,
          blockReason: 0,
          resourceStatus: 2
        }
      ],
      total: 1
    });
    const page = useGroupPullMarketingPage();
    await page.loadTasks();

    resetArmadaMockFailure(new Error("network down"));
    await page.loadTasks();

    assert.equal(page.rows.value[0]?.taskName, "已加载任务");
    assert.equal(page.total.value, 1);
    assert.deepEqual(elementPlusCalls(), [
      { type: "error", text: "network down" }
    ]);
  });
});
