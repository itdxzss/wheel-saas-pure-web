import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMock,
  resetArmadaMockQueue
} from "./__tests__/armada-test-double";
import { httpCalls, resetHttpMock } from "./__tests__/http-test-double";
import {
  createDataPackage,
  deleteDataPackage,
  exportDataPackagePhones,
  exportDataPackagePhonesBatch,
  exportHyperlinkClickAnalysis,
  exportDataPackageClickRecords,
  getDataPackage,
  getHyperlinkClickAnalysis,
  importDataPackagePhones,
  listDataPackageCountries,
  listDataPackagePhones,
  listDataPackages,
  resetDataPackageFailed,
  updateDataPackage
} from "./hyperlink-data-package";

describe("hyperlink data package API", () => {
  it("serializes country filters as one normalized comma-separated value", async () => {
    resetArmadaMock({
      list: [],
      page: 2,
      pageSize: 20,
      total: 0,
      totalPages: 0
    });

    await listDataPackages({
      page: 2,
      pageSize: 20,
      name: "  菲律宾  ",
      createdFrom: 1787846400000,
      createdTo: 1787932799999,
      minUvPercent: 2.5,
      maxUvPercent: 50,
      countryIso2s: ["ph", " UNKNOWN ", "PH", "id"],
      forTask: false
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/data-packages",
        opts: {
          params: {
            page: 2,
            pageSize: 20,
            name: "菲律宾",
            createdFrom: 1787846400000,
            createdTo: 1787932799999,
            minUvPercent: 2.5,
            maxUvPercent: 50,
            countryIso2s: "PH,UNKNOWN,ID",
            forTask: false
          }
        }
      }
    ]);
  });

  it("keeps nullable remarks and optimistic-lock versions in write payloads", async () => {
    resetArmadaMockQueue([{ id: 1 }, { id: 1 }]);

    await createDataPackage({ name: "  新客包  ", remark: "   " });
    await updateDataPackage(1, {
      name: "  新客包二期  ",
      remark: "  已复核  ",
      version: 3
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/data-packages",
        opts: { data: { name: "新客包", remark: null } }
      },
      {
        method: "put",
        url: "/api/data-packages/1",
        opts: {
          data: { name: "新客包二期", remark: "已复核", version: 3 }
        }
      }
    ]);
  });

  it("uploads mode and TXT file as the only multipart fields", async () => {
    resetArmadaMock({
      importId: 9,
      mode: "OVERWRITE",
      generation: 2,
      totalRows: 1,
      acceptedRows: 1,
      invalidRows: 0,
      duplicatedRows: 0,
      phoneCountAfterImport: 1
    });
    const file = new File(["639123456789"], "phones.txt", {
      type: "text/plain"
    });

    await importDataPackagePhones(7, { mode: "OVERWRITE", file });

    const [call] = armadaCalls();
    assert.equal(call.method, "post");
    assert.equal(call.url, "/api/data-packages/7/import");
    const form = (call.opts as { data: FormData }).data;
    const fieldNames: string[] = [];
    form.forEach((_, name) => fieldNames.push(name));
    assert.deepEqual(fieldNames, ["mode", "file"]);
    assert.equal(form.get("mode"), "OVERWRITE");
    const uploaded = form.get("file");
    assert.ok(uploaded instanceof File);
    assert.equal(uploaded.name, "phones.txt");
    assert.equal(await uploaded.text(), "639123456789");
    assert.equal((call.config as { timeout: number }).timeout, 120000);
  });

  it("uses detail, phone, country and delete contract endpoints", async () => {
    resetArmadaMockQueue([{}, {}, [], null]);

    await getDataPackage(11);
    await listDataPackagePhones(11, {
      page: 3,
      pageSize: 50,
      phone: " 639 ",
      poolStatus: "UNUSED",
      countryIso2: "unknown"
    });
    await listDataPackageCountries();
    await deleteDataPackage(11);

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/data-packages/11",
        opts: undefined
      },
      {
        method: "get",
        url: "/api/data-packages/11/phones",
        opts: {
          params: {
            page: 3,
            pageSize: 50,
            phone: "639",
            poolStatus: "UNUSED",
            countryIso2: "UNKNOWN"
          }
        }
      },
      {
        method: "get",
        url: "/api/data-packages/countries",
        opts: undefined
      },
      {
        method: "delete",
        url: "/api/data-packages/11",
        opts: undefined
      }
    ]);
  });

  it("resets failures and exports single or selected packages as raw TXT", async () => {
    resetArmadaMock(2);
    await resetDataPackageFailed(11);
    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/data-packages/11/reset-failed",
        opts: undefined
      }
    ]);

    const blob = new Blob(["639123456789\n"], { type: "text/plain" });
    resetHttpMock(blob, {
      "content-disposition":
        "attachment; filename*=UTF-8''philippines_success.txt",
      "x-export-count": "1"
    });
    const single = await exportDataPackagePhones(11, "success");
    const batch = await exportDataPackagePhonesBatch([11, 12], "unused");

    assert.equal(single.filename, "philippines_success.txt");
    assert.equal(single.exportedCount, 1);
    assert.equal(single.blob, blob);
    assert.equal(batch.filename, "philippines_success.txt");
    assert.deepEqual(httpCalls(), [
      {
        method: "get",
        url: "/api/data-packages/11/export",
        opts: {
          params: { usageStatus: "success" },
          responseType: "blob"
        },
        configKeys: ["beforeResponseCallback"]
      },
      {
        method: "post",
        url: "/api/data-packages/export",
        opts: {
          data: { ids: [11, 12], usageStatus: "unused" },
          responseType: "blob"
        },
        configKeys: ["beforeResponseCallback"]
      }
    ]);
  });

  it("uses the competitor click-record TXT/CSV export contract", async () => {
    const blob = new Blob([], { type: "text/plain" });
    resetHttpMock(blob, {
      "content-disposition":
        "attachment; filename*=UTF-8''data_package_clicks.txt",
      "x-export-count": "0"
    });

    await exportDataPackageClickRecords([11, 12], "txt");
    await exportDataPackageClickRecords([11, 12], "csv");

    assert.deepEqual(httpCalls(), [
      {
        method: "post",
        url: "/api/data-packages/clicks/export",
        opts: {
          data: { ids: [11, 12], format: "txt" },
          responseType: "blob"
        },
        configKeys: ["beforeResponseCallback"]
      },
      {
        method: "post",
        url: "/api/data-packages/clicks/export",
        opts: {
          data: { ids: [11, 12], format: "csv" },
          responseType: "blob"
        },
        configKeys: ["beforeResponseCallback"]
      }
    ]);
  });

  it("uses both click-analysis modes and per-threshold TXT export endpoints", async () => {
    const query = {
      dateFrom: 1787270400000,
      dateTo: 1787875199999,
      thresholds: [5, 10, 20],
      dimension: "recipient_country" as const,
      countryIso2: "ph"
    };
    resetArmadaMock({
      mode: "never-click",
      totalPhones: 0,
      buckets: [],
      countries: [],
      factSourceReady: false
    });

    await getHyperlinkClickAnalysis("never-click", query);
    await getHyperlinkClickAnalysis("uv-ratio", {
      ...query,
      dimension: undefined
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/hyperlink-tasks/click-analysis/never-click",
        opts: {
          params: {
            dateFrom: query.dateFrom,
            dateTo: query.dateTo,
            thresholds: "5,10,20",
            dimension: "recipient_country",
            countryIso2: "PH"
          }
        }
      },
      {
        method: "get",
        url: "/api/hyperlink-tasks/click-analysis/uv-ratio",
        opts: {
          params: {
            dateFrom: query.dateFrom,
            dateTo: query.dateTo,
            thresholds: "5,10,20",
            dimension: undefined,
            countryIso2: "PH"
          }
        }
      }
    ]);

    const blob = new Blob([], { type: "text/plain" });
    resetHttpMock(blob, { "x-export-count": "0" });
    await exportHyperlinkClickAnalysis("never-click", {
      ...query,
      threshold: 10
    });
    await exportHyperlinkClickAnalysis("uv-ratio", {
      ...query,
      threshold: 20,
      countryIso2: undefined
    });
    assert.deepEqual(
      httpCalls().map(call => [call.method, call.url, call.opts]),
      [
        [
          "post",
          "/api/hyperlink-tasks/click-analysis/never-click/export",
          {
            data: {
              dateFrom: query.dateFrom,
              dateTo: query.dateTo,
              threshold: 10,
              countryIso2: "PH",
              format: "txt"
            },
            responseType: "blob"
          }
        ],
        [
          "post",
          "/api/hyperlink-tasks/click-analysis/uv-ratio/export",
          {
            data: {
              dateFrom: query.dateFrom,
              dateTo: query.dateTo,
              threshold: 20,
              countryIso2: undefined,
              format: "txt"
            },
            responseType: "blob"
          }
        ]
      ]
    );
  });
});
