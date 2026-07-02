import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import { httpCalls, resetHttpMock } from "./__tests__/http-test-double";
import {
  exportAccountImportTask,
  listAccountImportTasks
} from "./account-import";

describe("account import API", () => {
  it("passes login result filters through to the list query", async () => {
    resetArmadaMock({ list: [], page: 1, pageSize: 10, total: 0 });

    await listAccountImportTasks({
      page: 1,
      pageSize: 10,
      login: "有失败"
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/account-imports",
        opts: {
          params: {
            page: 1,
            pageSize: 10,
            sourceFileName: undefined,
            importFormat: undefined,
            accountGroupId: undefined,
            deviceOs: undefined,
            accountType: undefined,
            login: "有失败",
            status: undefined
          }
        }
      }
    ]);
  });

  it("downloads export files as blobs and uses filename* from response headers", async () => {
    const blob = new Blob(["payload"], { type: "application/zip" });
    resetHttpMock(blob, {
      "content-disposition":
        "attachment; filename*=UTF-8''account-import-42-success.zip"
    });

    const result = await exportAccountImportTask(42, "SUCCESS");

    assert.equal(result.filename, "account-import-42-success.zip");
    assert.equal(result.blob, blob);
    assert.deepEqual(httpCalls(), [
      {
        method: "get",
        url: "/api/account-imports/42/export",
        opts: { params: { scope: "success" }, responseType: "blob" },
        configKeys: ["beforeResponseCallback"]
      }
    ]);
  });

  it("falls back to filename when content-disposition has plain filename", async () => {
    const blob = new Blob(["payload"], { type: "text/plain" });
    resetHttpMock(blob, {
      "Content-Disposition":
        'attachment; filename="account-import-42-all.txt"'
    });

    const result = await exportAccountImportTask(42, "");

    assert.equal(result.filename, "account-import-42-all.txt");
    assert.equal(result.blob, blob);
    assert.deepEqual(httpCalls(), [
      {
        method: "get",
        url: "/api/account-imports/42/export",
        opts: { params: { scope: "all" }, responseType: "blob" },
        configKeys: ["beforeResponseCallback"]
      }
    ]);
  });
});
