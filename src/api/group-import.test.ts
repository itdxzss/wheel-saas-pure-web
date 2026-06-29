import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import { httpCalls, resetHttpMock } from "./__tests__/http-test-double";
import {
  batchDeleteGroupImportGroups,
  createGroupLinkImportBatch,
  createGroupLinkLabel,
  exportGroupImportGroupFailures,
  listGroupLinksForMigration,
  listGroupImportDetails,
  listGroupImportGroups,
  listGroupLinkLabels,
  migrateGroupLinks
} from "./group-import";

describe("group import API", () => {
  it("uses armada group-link-labels as the import group list", async () => {
    resetArmadaMock({ list: [], total: 0 });

    await listGroupImportGroups({
      page: 2,
      pageSize: 20,
      keyword: "巴铁",
      id: 31,
      importedFrom: 1782705600000,
      importedTo: 1782792000000,
      status: "PARTIAL"
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/group-link-labels",
        opts: {
          params: {
            page: 2,
            pageSize: 20,
            keyword: "巴铁",
            id: 31,
            importedFrom: 1782705600000,
            importedTo: 1782792000000,
            status: "PARTIAL"
          }
        }
      }
    ]);
  });

  it("creates labels and loads label options", async () => {
    resetArmadaMock({ list: [], total: 0 });

    await listGroupLinkLabels("印度");
    await createGroupLinkLabel({
      name: "印度导入",
      region: "印度",
      remark: "测试"
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/group-link-labels",
        opts: { params: { page: 1, pageSize: 1000, keyword: "印度" } }
      },
      {
        method: "post",
        url: "/api/group-link-labels",
        opts: {
          data: { name: "印度导入", region: "印度", remark: "测试" }
        }
      }
    ]);
  });

  it("posts multipart import payloads", async () => {
    const file = new File(["link"], "links.txt", { type: "text/plain" });
    resetArmadaMock({ batchId: 1 });

    await createGroupLinkImportBatch({
      labelId: 9,
      batchName: "批次A",
      text: "https://chat.whatsapp.com/ABC",
      file
    });

    const call = armadaCalls()[0];
    assert.equal(call.method, "post");
    assert.equal(call.url, "/api/group-links/import");
    assert.ok(call.opts && typeof call.opts === "object");
    const data = (call.opts as { data: FormData }).data;
    assert.equal(data.get("labelId"), "9");
    assert.equal(data.get("batchName"), "批次A");
    assert.equal(data.get("text"), "https://chat.whatsapp.com/ABC");
    assert.equal(data.get("file"), file);
  });

  it("uses camelCase query params for details and failed export", async () => {
    resetArmadaMock({ list: [], total: 0 });
    resetHttpMock(new Blob([]));

    await listGroupImportDetails({ labelId: 7, page: 1, pageSize: 10 });
    await exportGroupImportGroupFailures(7, 11);

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/group-link-imports/details",
        opts: { params: { labelId: 7, batchId: undefined, page: 1, pageSize: 10 } }
      }
    ]);
    assert.deepEqual(httpCalls(), [
      {
        method: "get",
        url: "/api/group-link-imports/failed/export",
        opts: { params: { labelId: 7, batchId: 11 }, responseType: "blob" }
      }
    ]);
  });

  it("batch deletes labels through the group-link-label endpoint", async () => {
    resetArmadaMock(2);

    await batchDeleteGroupImportGroups([7, 8]);

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/group-link-labels/batch-delete",
        opts: { data: { ids: [7, 8] } }
      }
    ]);
  });

  it("loads links for migration by label id", async () => {
    resetArmadaMock({ list: [], total: 0 });

    await listGroupLinksForMigration({
      labelId: 7,
      page: 2,
      pageSize: 20,
      keyword: "测试群"
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/group-links",
        opts: {
          params: { labelId: 7, page: 2, pageSize: 20, keyword: "测试群" }
        }
      }
    ]);
  });

  it("posts group link migration payloads with camelCase fields", async () => {
    resetArmadaMock(3);

    await migrateGroupLinks({ linkIds: [101, 102, 103], targetLabelId: 9 });

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/group-links/migrate",
        opts: { data: { linkIds: [101, 102, 103], targetLabelId: 9 } }
      }
    ]);
  });
});
