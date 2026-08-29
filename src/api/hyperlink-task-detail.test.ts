import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMockFailure,
  resetArmadaMockQueue
} from "./__tests__/armada-test-double";
import { httpCalls, resetHttpMock } from "./__tests__/http-test-double";
import {
  createHyperlinkRecipientExport,
  downloadHyperlinkTaskExport,
  getHyperlinkTaskExport,
  getHyperlinkTaskSummary,
  listHyperlinkTaskRecipients
} from "./hyperlink-task-detail";

describe("hyperlink task H4 API", () => {
  it("calls summary and database-paged recipient endpoints with all filters", async () => {
    resetArmadaMockQueue([
      { id: 9, taskName: "任务九" },
      { list: [], page: 2, pageSize: 50, total: 0, totalPages: 0 }
    ]);

    await getHyperlinkTaskSummary(9);
    await listHyperlinkTaskRecipients(9, {
      page: 2,
      pageSize: 50,
      phone: " +62812 ",
      recipientCountryIso2: " id ",
      senderCountryIso2: " us ",
      failReason: " 完整失败原因 ",
      sortField: "id",
      sortOrder: "desc"
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/hyperlink-tasks/9/summary",
        opts: undefined
      },
      {
        method: "get",
        url: "/api/hyperlink-tasks/9/recipients",
        opts: {
          params: {
            page: 2,
            pageSize: 50,
            phone: "+62812",
            recipientCountryIso2: "ID",
            senderCountryIso2: "US",
            failReason: "完整失败原因",
            sortField: "id",
            sortOrder: "desc"
          }
        }
      }
    ]);
  });

  it("creates and polls the public export shell without paging fields", async () => {
    resetArmadaMockQueue([
      { id: 77, exportType: "RECIPIENTS", status: "PENDING" },
      { id: 77, exportType: "RECIPIENTS", status: "SUCCESS" }
    ]);

    await createHyperlinkRecipientExport(9, {
      phone: " 628 ",
      recipientCountryIso2: " id ",
      senderCountryIso2: " us ",
      failReason: " 原因 ",
      sortField: "id",
      sortOrder: "asc"
    });
    await getHyperlinkTaskExport(77);

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/hyperlink-tasks/9/recipients/export",
        opts: {
          data: {
            phone: "628",
            recipientCountryIso2: "ID",
            senderCountryIso2: "US",
            failReason: "原因",
            sortField: "id",
            sortOrder: "asc"
          }
        }
      },
      {
        method: "get",
        url: "/api/hyperlink-task-exports/77",
        opts: undefined
      }
    ]);
  });

  it("downloads the generated UTF-8 CSV using the server filename", async () => {
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf, 0x31])], {
      type: "text/csv;charset=UTF-8"
    });
    resetHttpMock(blob, {
      "Content-Type": "text/csv;charset=UTF-8",
      "Content-Disposition":
        "attachment; filename*=UTF-8''hyperlink-recipients-9-20260829120000.csv"
    });

    const result = await downloadHyperlinkTaskExport(77);

    assert.equal(result.filename, "hyperlink-recipients-9-20260829120000.csv");
    assert.equal(result.blob, blob);
    assert.deepEqual(httpCalls(), [
      {
        method: "get",
        url: "/api/hyperlink-task-exports/77/download",
        opts: { responseType: "blob" },
        configKeys: ["beforeResponseCallback", "timeout"]
      }
    ]);
  });

  it("surfaces the backend envelope error for failed status reads", async () => {
    resetArmadaMockFailure(new Error("导出失败，请重新操作"));
    await assert.rejects(() => getHyperlinkTaskExport(77), /导出失败/);
  });
});
