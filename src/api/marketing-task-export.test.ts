import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMock,
  resetArmadaMockQueue
} from "./__tests__/armada-test-double";
import { httpCalls, resetHttpMock } from "./__tests__/http-test-double";
import {
  createMarketingTaskExport,
  downloadMarketingTaskExport,
  getMarketingTaskExport,
  listMarketingTaskExportCountries
} from "./marketing-task-export";

describe("marketing task export API", () => {
  it("loads real country options for the export dialog", async () => {
    resetArmadaMock({
      rows: [
        {
          value: "ID",
          iso2: "ID",
          nameZh: "印度尼西亚",
          nameEn: "Indonesia",
          phonePrefix: "+62",
          flag: "🇮🇩"
        }
      ]
    });

    const countries = await listMarketingTaskExportCountries();

    assert.equal(countries[0].iso2, "ID");
    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/admin/countries/options",
        opts: { params: { scope: "marketing-export" } }
      }
    ]);
  });

  it("creates and queries an asynchronous export job", async () => {
    resetArmadaMockQueue([
      {
        id: 9001,
        exportMode: "COUNTRY_ENTRY",
        status: "PENDING",
        summaryRowCount: 0,
        detailRowCount: 0,
        snapshotAt: 1785200000000,
        downloadReady: false,
        createdAt: 1785200000000
      },
      {
        id: 9001,
        exportMode: "COUNTRY_ENTRY",
        status: "SUCCESS",
        summaryRowCount: 0,
        detailRowCount: 2,
        snapshotAt: 1785200000000,
        downloadReady: true,
        createdAt: 1785200000000,
        finishedAt: 1785200010000,
        fileName: "国家进群数据_批量任务_多国家_20260729_120000.xlsx"
      }
    ]);

    await createMarketingTaskExport({
      exportMode: "COUNTRY_ENTRY",
      taskIds: [11, 22],
      countryIso2s: ["ID", "MY"]
    });
    await getMarketingTaskExport(9001);

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/marketing-task-exports",
        opts: {
          data: {
            exportMode: "COUNTRY_ENTRY",
            taskIds: [11, 22],
            countryIso2s: ["ID", "MY"]
          }
        }
      },
      {
        method: "get",
        url: "/api/marketing-task-exports/9001",
        opts: undefined
      }
    ]);
  });

  it("downloads a successful job with the backend UTF-8 filename", async () => {
    const blob = new Blob([new Uint8Array([0x50, 0x4b, 0x03, 0x04])], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    resetHttpMock(blob, {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        "attachment; filename*=UTF-8''%E5%9B%BD%E5%AE%B6%E8%BF%9B%E7%BE%A4%E6%95%B0%E6%8D%AE.xlsx"
    });

    const result = await downloadMarketingTaskExport(9001);

    assert.equal(result.filename, "国家进群数据.xlsx");
    assert.equal(result.blob, blob);
    assert.deepEqual(httpCalls(), [
      {
        method: "get",
        url: "/api/marketing-task-exports/9001/download",
        opts: { responseType: "blob" },
        configKeys: ["beforeResponseCallback", "timeout"]
      }
    ]);
  });

  it("surfaces a JSON download error instead of saving it as Excel", async () => {
    const blob = new Blob(
      [JSON.stringify({ message: "导出文件已过期，请重新导出。" })],
      { type: "application/json" }
    );
    resetHttpMock(blob, { "Content-Type": "application/json" });

    await assert.rejects(
      downloadMarketingTaskExport(9001),
      /导出文件已过期，请重新导出。/
    );
  });

  it("rejects a non-xlsx gateway response instead of saving it", async () => {
    const blob = new Blob(["<html>bad gateway</html>"], {
      type: "text/html"
    });
    resetHttpMock(blob, { "Content-Type": "text/html" });

    await assert.rejects(
      downloadMarketingTaskExport(9001),
      /导出失败，请稍后重试或联系技术人员/
    );
  });
});
