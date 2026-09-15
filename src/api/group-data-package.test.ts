import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import { httpCalls, resetHttpMock } from "./__tests__/http-test-double";
import {
  createGroupDataPackage,
  updateGroupDataPackage,
  listGroupDataPackages,
  importGroupDataPackage,
  listGroupDataPackageImports,
  exportGroupDataPackage,
  exportGroupDataPackages,
  groupPackageDownloadFilename
} from "./group-data-package";

describe("group data package API contracts", () => {
  it("keeps search, availability and pagination on the server", async () => {
    resetArmadaMock({ list: [] });
    await listGroupDataPackages({
      name: "  新客  ",
      countryIso2: " th ",
      continent: "ASIA",
      usageBusiness: "STANDARD_PULL",
      page: 3,
      pageSize: 20,
      createdFrom: 100,
      createdTo: 200,
      forTask: true
    });
    assert.deepEqual(armadaCalls()[0], {
      method: "get",
      url: "/api/group-data-packages",
      opts: {
        params: {
          name: "新客",
          countryIso2: "TH",
          continent: "ASIA",
          usageBusiness: "STANDARD_PULL",
          page: 3,
          pageSize: 20,
          createdFrom: 100,
          createdTo: 200,
          forTask: true
        }
      }
    });
  });

  it("trims metadata while retaining the edit version", async () => {
    resetArmadaMock({ id: 12 });
    await createGroupDataPackage({ name: " 新客 ", remark: "  " });
    await updateGroupDataPackage(12, {
      name: " 新客2 ",
      remark: " 来源 ",
      version: 7
    });
    assert.deepEqual(
      armadaCalls().map(call => call.opts),
      [
        { data: { name: "新客", remark: null } },
        { data: { name: "新客2", remark: "来源", version: 7 } }
      ]
    );
  });

  it("uploads the original file without stripping A markers and preserves filter settings", async () => {
    resetArmadaMock({ importId: 5 });
    const file = new File(["66812345678A\n"], "原料.txt", {
      type: "text/plain"
    });
    await importGroupDataPackage(12, {
      mode: "overwrite",
      file,
      privacyFilterDays: 0
    });
    const call = armadaCalls()[0];
    assert.equal(call.url, "/api/group-data-packages/12/import");
    const form = (call.opts as { data: FormData }).data;
    assert.equal(await (form.get("file") as File).text(), "66812345678A\n");
    assert.equal(form.get("mode"), "overwrite");
    assert.equal(form.get("privacyFilterDays"), "0");
  });

  it("loads paginated import audit records", async () => {
    resetArmadaMock({ list: [], total: 0 });
    await listGroupDataPackageImports(12, { page: 2, pageSize: 50 });
    assert.deepEqual(armadaCalls()[0], {
      method: "get",
      url: "/api/group-data-packages/12/imports",
      opts: { params: { page: 2, pageSize: 50 } }
    });
  });

  it("downloads state-filtered files using the actual filename and count", async () => {
    resetHttpMock(new Blob(["66812345678A\n"], { type: "text/plain" }), {
      "content-disposition":
        "attachment; filename*=UTF-8''%E6%8B%89%E7%BE%A4.txt",
      "x-export-count": "1"
    });
    const result = await exportGroupDataPackage(12, "unused", "txt");
    assert.equal(result.filename, "拉群.txt");
    assert.equal(result.exportedCount, 1);
    assert.equal(await result.blob.text(), "66812345678A\n");
    assert.deepEqual(httpCalls()[0].opts, {
      params: { usageStatus: "unused", format: "txt" },
      responseType: "blob"
    });
    await exportGroupDataPackages([12, 19], "privacy_rejected", "csv");
    assert.deepEqual(httpCalls()[1].opts, {
      data: { ids: [12, 19], usageStatus: "privacy_rejected", format: "csv" },
      responseType: "blob"
    });
  });

  it("does not download a business-error JSON as a successful TXT", async () => {
    resetHttpMock(
      new Blob([JSON.stringify({ code: 403, message: "无导出权限" })], {
        type: "application/json"
      })
    );
    await assert.rejects(
      exportGroupDataPackage(12, "all", "txt"),
      /无导出权限/
    );
    assert.equal(
      groupPackageDownloadFilename(
        "attachment; filename*=UTF-8''bad%xx",
        "fallback.txt"
      ),
      "fallback.txt"
    );
  });
});
