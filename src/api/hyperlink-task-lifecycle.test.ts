import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMockQueue
} from "./__tests__/armada-test-double";
import {
  actOnHyperlinkTask,
  createHyperlinkTask,
  getHyperlinkTaskProvisionStatus,
  quoteHyperlinkTask,
  updateHyperlinkTask
} from "./hyperlink-task-lifecycle";

describe("hyperlink task H3 lifecycle API", () => {
  it("uses the frozen quote contract for CREATE and START", async () => {
    resetArmadaMockQueue([{}, {}]);

    await quoteHyperlinkTask({
      purpose: "CREATE",
      taskId: null,
      dataPackageId: 21,
      taskMode: "instant",
      maxExecutingAccounts: 30
    });
    await quoteHyperlinkTask({
      purpose: "START",
      taskId: 11,
      dataPackageId: null,
      taskMode: null,
      maxExecutingAccounts: null
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/hyperlink-tasks/quote",
        opts: {
          data: {
            purpose: "CREATE",
            taskId: null,
            dataPackageId: 21,
            taskMode: "instant",
            maxExecutingAccounts: 30
          }
        }
      },
      {
        method: "post",
        url: "/api/hyperlink-tasks/quote",
        opts: {
          data: {
            purpose: "START",
            taskId: 11,
            dataPackageId: null,
            taskMode: null,
            maxExecutingAccounts: null
          }
        }
      }
    ]);
  });

  it("keeps H2 save payload opaque while exposing create update and provision paths", async () => {
    resetArmadaMockQueue([{}, {}, {}]);
    const create = { version: null, taskName: "新任务", enabled: false };
    const update = { version: 3, taskName: "已编辑", enabled: true };

    await createHyperlinkTask(create);
    await updateHyperlinkTask(11, update);
    await getHyperlinkTaskProvisionStatus(11);

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/hyperlink-tasks",
        opts: { data: create }
      },
      {
        method: "put",
        url: "/api/hyperlink-tasks/11",
        opts: { data: update }
      },
      {
        method: "get",
        url: "/api/hyperlink-tasks/11/provision-status",
        opts: undefined
      }
    ]);
  });

  it("always sends optimistic-lock version and explicit quoteToken on actions", async () => {
    resetArmadaMockQueue([{}, {}]);

    await actOnHyperlinkTask(11, {
      action: "START",
      version: 3,
      quoteToken: "start-quote"
    });
    await actOnHyperlinkTask(11, {
      action: "PAUSE",
      version: 4,
      quoteToken: null
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/hyperlink-tasks/11/action",
        opts: {
          data: { action: "START", version: 3, quoteToken: "start-quote" }
        }
      },
      {
        method: "post",
        url: "/api/hyperlink-tasks/11/action",
        opts: { data: { action: "PAUSE", version: 4, quoteToken: null } }
      }
    ]);
  });
});
