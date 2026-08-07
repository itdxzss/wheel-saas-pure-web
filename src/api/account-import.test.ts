import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import { httpCalls, resetHttpMock } from "./__tests__/http-test-double";
import {
  createAccountImportTask,
  exportAccountImportTask,
  listAccountImportTasks
} from "./account-import";

describe("account import API", () => {
  it("maps both compatible and legacy labels to import format 1", async () => {
    resetArmadaMock({ list: [], page: 1, pageSize: 10, total: 0 });

    await listAccountImportTasks({ import_type: "五/六段号" });
    const currentParams = (
      armadaCalls()[0]?.opts as {
        params: { importFormat: number };
      }
    ).params;
    assert.equal(currentParams.importFormat, 1);

    resetArmadaMock({ list: [], page: 1, pageSize: 10, total: 0 });
    await listAccountImportTasks({ import_type: "六段号" });
    const legacyParams = (
      armadaCalls()[0]?.opts as {
        params: { importFormat: number };
      }
    ).params;
    assert.equal(legacyParams.importFormat, 1);
  });

  it("renders import format 1 as the compatible five/six label", async () => {
    resetArmadaMock({
      list: [{ id: 1, sourceFileName: "accounts.txt", importFormat: 1 }],
      page: 1,
      pageSize: 10,
      total: 1
    });

    const result = await listAccountImportTasks();

    assert.equal(result.list[0]?.import_type, "五/六段号");
  });

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

  it("posts account import IP allocation mode as form-data", async () => {
    resetArmadaMock({
      id: 1,
      sourceFileName: "导入",
      importFormat: 2,
      deviceOs: 1,
      accountType: 1,
      ipAllocationMode: "mixed",
      totalRows: 0,
      importedRows: 0,
      duplicateRows: 0,
      formatErrorRows: 0,
      status: 2
    });

    await createAccountImportTask({
      import_type: "JSON号",
      group: "默认分组",
      group_id: 1,
      device: "安卓",
      account_type: "个人",
      ip_allocation_mode: "mixed",
      text: "[]"
    });

    const [{ opts }] = armadaCalls();
    const form = (opts as { data: FormData }).data;
    assert.equal(form.get("ipAllocationMode"), "mixed");
    assert.equal(form.get("ipRegion"), null);
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
      "Content-Disposition": 'attachment; filename="account-import-42-all.txt"'
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

  it("uses unified fallback filename when content-disposition is unavailable", async () => {
    const blob = new Blob(["payload"], { type: "application/zip" });
    resetHttpMock(blob, {});

    const today = new Date();
    const date = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0")
    ].join("");
    const result = await exportAccountImportTask(42, "ALL", {
      import_type: "JSON号",
      total: 6,
      imported: 4,
      success: 4,
      fail: 1,
      login_success: 2,
      login_failed: 1,
      login_fail: 1,
      abnormal: 1
    });

    assert.equal(
      result.filename,
      `账号导入_${date}_全部_共6个_成功2个_失败3个.zip`
    );
    assert.equal(result.blob, blob);
  });
});
