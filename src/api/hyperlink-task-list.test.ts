import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMock,
  resetArmadaMockQueue
} from "./__tests__/armada-test-double";
import { httpCalls, resetHttpMock } from "./__tests__/http-test-double";
import {
  actionHyperlinkTask,
  exportHyperlinkTasks,
  getHyperlinkTaskCreateContext,
  listHyperlinkTasks
} from "./hyperlink-task-list";

describe("hyperlink task H1 API", () => {
  it("serializes all five filters and the frozen page contract", async () => {
    resetArmadaMock({
      list: [],
      page: 2,
      pageSize: 200,
      total: 0,
      totalPages: 0
    });

    await listHyperlinkTasks({
      page: 2,
      pageSize: 200,
      taskName: "  菲律宾首发  ",
      runStatus: 3,
      taskMode: "cycle",
      countryIso2: " ph ",
      createdAtStart: 1000,
      createdAtEnd: 2000
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/hyperlink-tasks",
        opts: {
          params: {
            page: 2,
            pageSize: 200,
            taskName: "菲律宾首发",
            runStatus: 3,
            taskMode: "cycle",
            countryIso2: "PH",
            createdAtStart: 1000,
            createdAtEnd: 2000
          }
        }
      }
    ]);
  });

  it("keeps create-context and non-START lifecycle calls on explicit contracts", async () => {
    resetArmadaMockQueue([{}, { taskId: 9, runStatus: 3, version: 4 }]);

    await getHyperlinkTaskCreateContext();
    await actionHyperlinkTask(9, "PAUSE", 3);

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/hyperlink-tasks/create-context",
        opts: undefined
      },
      {
        method: "post",
        url: "/api/hyperlink-tasks/9/action",
        opts: { data: { action: "PAUSE", version: 3, quoteToken: null } }
      }
    ]);
  });

  it("exports the full filter and reads UTF-8 filename plus row count", async () => {
    const blob = new Blob(['\uFEFF"ID"\r\n'], {
      type: "text/csv;charset=UTF-8"
    });
    resetHttpMock(blob, {
      "content-disposition":
        "attachment; filename*=UTF-8''hyperlink-tasks-20260829120000.csv",
      "x-export-count": "26"
    });

    const result = await exportHyperlinkTasks({
      page: 5,
      pageSize: 50,
      taskName: "活动",
      runStatus: 1,
      taskMode: "rolling",
      countryIso2: "br",
      createdAtStart: 10,
      createdAtEnd: 20
    });

    assert.equal(result.blob, blob);
    assert.equal(result.filename, "hyperlink-tasks-20260829120000.csv");
    assert.equal(result.exportedCount, 26);
    assert.deepEqual(httpCalls(), [
      {
        method: "get",
        url: "/api/hyperlink-tasks/export",
        opts: {
          params: {
            taskName: "活动",
            runStatus: 1,
            taskMode: "rolling",
            countryIso2: "BR",
            createdAtStart: 10,
            createdAtEnd: 20
          },
          responseType: "blob"
        },
        configKeys: ["beforeResponseCallback"]
      }
    ]);
  });

  it("rejects a business JSON blob instead of downloading it as CSV", async () => {
    resetHttpMock(
      new Blob([JSON.stringify({ code: 40001, message: "筛选非法" })], {
        type: "application/json"
      })
    );

    await assert.rejects(() => exportHyperlinkTasks(), /筛选非法/);
  });
});
