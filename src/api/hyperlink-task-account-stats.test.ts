import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMock,
  resetArmadaMockQueue
} from "./__tests__/armada-test-double";
import { httpCalls, resetHttpMock } from "./__tests__/http-test-double";
import {
  createHyperlinkAccountStatsExport,
  downloadHyperlinkTaskExportJob,
  getHyperlinkTaskExportJob,
  listHyperlinkAccountStats
} from "./hyperlink-task-account-stats";

describe("hyperlink account stats API", () => {
  it("uses the frozen H5 query path and preserves all filters", async () => {
    resetArmadaMock({
      list: [],
      page: 2,
      pageSize: 20,
      total: 0,
      totalPages: 0
    });

    await listHyperlinkAccountStats(88, {
      page: 2,
      pageSize: 20,
      startAt: 1000,
      endAt: 2000,
      senderCountryIso2: "BR",
      successRateMin: 70,
      successRateMax: 90,
      sortField: "failedNum",
      sortOrder: "asc"
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/hyperlink-tasks/88/account-stats",
        opts: {
          params: {
            page: 2,
            pageSize: 20,
            startAt: 1000,
            endAt: 2000,
            senderCountryIso2: "BR",
            successRateMin: 70,
            successRateMax: 90,
            sortField: "failedNum",
            sortOrder: "asc"
          }
        }
      }
    ]);
  });

  it("creates and polls the common asynchronous CSV job", async () => {
    resetArmadaMockQueue([
      { id: 7, exportType: "ACCOUNT_STATS", status: "PENDING" },
      { id: 7, exportType: "ACCOUNT_STATS", status: "SUCCESS" }
    ]);

    await createHyperlinkAccountStatsExport(88, {
      senderCountryIso2: "US",
      successRateMin: 50,
      sortField: "successNum",
      sortOrder: "desc"
    });
    await getHyperlinkTaskExportJob(7);

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/hyperlink-tasks/88/account-stats/export",
        opts: {
          data: {
            senderCountryIso2: "US",
            successRateMin: 50,
            sortField: "successNum",
            sortOrder: "desc"
          }
        }
      },
      {
        method: "get",
        url: "/api/hyperlink-task-exports/7",
        opts: undefined
      }
    ]);
  });

  it("downloads CSV using the backend UTF-8 filename", async () => {
    const blob = new Blob(["\ufeff发送账号\n未分配\n"], { type: "text/csv" });
    resetHttpMock(blob, {
      "Content-Type": "text/csv;charset=UTF-8",
      "Content-Disposition":
        "attachment; filename*=UTF-8''hyperlink-account-stats-88-20260829120000.csv"
    });

    const result = await downloadHyperlinkTaskExportJob(7);

    assert.equal(
      result.filename,
      "hyperlink-account-stats-88-20260829120000.csv"
    );
    assert.equal(result.blob, blob);
    assert.deepEqual(httpCalls(), [
      {
        method: "get",
        url: "/api/hyperlink-task-exports/7/download",
        opts: { responseType: "blob" },
        configKeys: ["beforeResponseCallback", "timeout"]
      }
    ]);
  });

  it("surfaces a JSON download failure", async () => {
    const blob = new Blob([JSON.stringify({ message: "导出文件已过期" })], {
      type: "application/json"
    });
    resetHttpMock(blob, { "Content-Type": "application/json" });

    await assert.rejects(downloadHyperlinkTaskExportJob(7), /导出文件已过期/);
  });
});
