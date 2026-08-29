import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMock,
  resetArmadaMockQueue
} from "./__tests__/armada-test-double";
import {
  actionFeedTask,
  createFeedTask,
  listFeedTaskAccounts,
  listFeedTasks,
  updateFeedTask
} from "./feed-task";

describe("feed task API", () => {
  it("uses the tenant feed task endpoints", async () => {
    resetArmadaMockQueue([{}, {}, {}, {}, {}, {}]);
    const form = {
      name: "动态推广",
      accountFilter: { accountGroupId: 8 },
      title: "限时特惠",
      description: "点击查看详情",
      content: "欢迎查看活动",
      promotionLink: "https://example.com",
      textColor: "#fff",
      backgroundColor: "#075E54",
      taskDelayMinutes: 0,
      status: 1 as const,
      concurrency: 10,
      retryMax: 3,
      taskMode: "instant" as const,
      taskPlannedEndAt: null
    };

    await listFeedTasks({ page: 2, pageSize: 20, name: "动态" });
    await createFeedTask(form, new File(["image"], "preview.jpg"));
    await updateFeedTask(8, form, null);
    await actionFeedTask(8, "pause");
    await listFeedTaskAccounts(8, { page: 1, pageSize: 20 });

    assert.deepEqual(
      armadaCalls().map(call => `${call.method} ${call.url}`),
      [
        "get /api/feed-tasks",
        "post /api/feed-tasks",
        "put /api/feed-tasks/8",
        "post /api/feed-tasks/8/action",
        "get /api/feed-tasks/8/data"
      ]
    );
    const formData = (armadaCalls()[1].opts as { data: FormData }).data;
    assert.equal(formData.get("accountFilter"), JSON.stringify({ accountGroupId: 8 }));
    assert.ok(formData.get("linkPreviewImage") instanceof File);
  });

  it("reuses the existing tenant account list for candidate counts", async () => {
    resetArmadaMock({ total: 12, list: [] });

    const { countFeedTaskAccounts } = await import("./feed-task");
    const count = await countFeedTaskAccounts({
      accountGroupId: 8,
      accountType: 1,
      callable: true
    });

    assert.equal(count, 12);
    assert.deepEqual(armadaCalls()[0], {
      method: "get",
      url: "/api/accounts",
      opts: {
        params: {
          page: 1,
          pageSize: 1,
          accountState: 2,
          accountType: 1,
          accountGroupId: 8,
          callable: true
        }
      }
    });
  });
});
