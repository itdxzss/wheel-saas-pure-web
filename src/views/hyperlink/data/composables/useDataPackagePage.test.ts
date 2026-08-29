import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMock,
  resetArmadaMockQueue
} from "@/api/__tests__/armada-test-double";
import type { DataPackageListItem } from "@/api/hyperlink-data-package";
import {
  createDataPackageTableColumns,
  dataPackageImportBlocked,
  dataPackageCountryLabel,
  useDataPackagePage
} from "./useDataPackagePage";

function dataPackageRow(
  overrides: Partial<DataPackageListItem> = {}
): DataPackageListItem {
  return {
    id: 101,
    name: "菲律宾新客",
    remark: "8 月活动",
    countries: ["PH"],
    primaryCountryIso2: "PH",
    metrics: {
      totalCount: 4800,
      unusedCount: 4800,
      usedCount: 0,
      sentCount: 0,
      deliveredCount: 0,
      failedCount: 0,
      unregisteredCount: 0,
      clickUvCount: 0
    },
    version: 1,
    createdAt: 1787881200000,
    updatedAt: 1787881200000,
    ...overrides
  };
}

function emptyPage(page = 1, pageSize = 20) {
  return { list: [], page, pageSize, total: 0, totalPages: 0 };
}

describe("hyperlink data package page state", () => {
  it("keeps the contract metric columns in product order", () => {
    assert.deepEqual(
      createDataPackageTableColumns().map(column => column.label),
      ["ID", "数据包", "号码使用", "投递漏斗", "创建时间"]
    );
  });

  it("loads page 20 with name, date and country filters", async () => {
    resetArmadaMock({
      list: [dataPackageRow()],
      page: 2,
      pageSize: 20,
      total: 21,
      totalPages: 2
    });
    const state = useDataPackagePage();
    state.page.value = 2;
    state.searchForm.value = {
      name: " 菲律宾 ",
      createdRange: [new Date(1787846400000), new Date(1787932799999)],
      minUvPercent: 1.5,
      maxUvPercent: 25,
      countryIso2s: ["PH", "UNKNOWN"]
    };

    await state.refreshDataPackages();

    assert.equal(state.rows.value.length, 1);
    assert.equal(state.total.value, 21);
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
            minUvPercent: 1.5,
            maxUvPercent: 25,
            countryIso2s: "PH,UNKNOWN",
            forTask: false
          }
        }
      }
    ]);
  });

  it("uses UNKNOWN for an unrecognized country option", () => {
    const options = [
      { value: "PH", countryIso2: "PH", nameZh: "菲律宾" },
      { value: "UNKNOWN", countryIso2: null, nameZh: "未识别" }
    ];

    assert.equal(dataPackageCountryLabel("PH", options), "菲律宾 (PH)");
    assert.equal(dataPackageCountryLabel(null, options), "未识别");
  });

  it("blocks the import entry when any existing country is restricted", () => {
    assert.equal(
      dataPackageImportBlocked(
        dataPackageRow({ countries: ["PH", "CN"], primaryCountryIso2: "PH" })
      ),
      true
    );
    assert.equal(dataPackageImportBlocked(dataPackageRow()), false);
  });

  it("opens phone detail with fixed page size 50 and current-generation filters", async () => {
    resetArmadaMock({
      list: [],
      page: 1,
      pageSize: 50,
      total: 0,
      totalPages: 0
    });
    const state = useDataPackagePage();

    await state.openPhoneDrawer(dataPackageRow());

    assert.equal(state.phoneDrawerVisible.value, true);
    assert.equal(state.phonePageSize.value, 50);
    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/data-packages/101/phones",
        opts: {
          params: {
            page: 1,
            pageSize: 50,
            phone: undefined,
            poolStatus: undefined,
            countryIso2: undefined
          }
        }
      }
    ]);
  });

  it("creates and edits with server refresh and the row version", async () => {
    resetArmadaMockQueue([
      dataPackageRow(),
      emptyPage(),
      dataPackageRow({ version: 4 }),
      emptyPage()
    ]);
    const state = useDataPackagePage();

    state.openCreateForm();
    await state.saveMetadata({ name: " 新包 ", remark: null });
    state.openEditForm(dataPackageRow({ version: 3 }));
    await state.saveMetadata({ name: " 新包二期 ", remark: " 已复核 " });

    assert.deepEqual(
      armadaCalls().map(call => [call.method, call.url]),
      [
        ["post", "/api/data-packages"],
        ["get", "/api/data-packages"],
        ["put", "/api/data-packages/101"],
        ["get", "/api/data-packages"]
      ]
    );
    assert.deepEqual((armadaCalls()[2].opts as { data: unknown }).data, {
      name: "新包二期",
      remark: "已复核",
      version: 3
    });
  });

  it("closes the import dialog and refreshes after an overwrite import", async () => {
    const result = {
      importId: 9001,
      mode: "OVERWRITE" as const,
      generation: 2,
      totalRows: 4,
      acceptedRows: 2,
      invalidRows: 1,
      duplicatedRows: 1,
      phoneCountAfterImport: 2
    };
    resetArmadaMockQueue([result, emptyPage()]);
    const state = useDataPackagePage();
    state.openImport(dataPackageRow(), "OVERWRITE");

    await state.submitImport({
      mode: "OVERWRITE",
      file: new File(["639123456789"], "phones.txt")
    });

    assert.equal(state.importVisible.value, false);
    const form = (armadaCalls()[0].opts as { data: FormData }).data;
    assert.equal(form.get("mode"), "OVERWRITE");
    assert.deepEqual(
      armadaCalls().map(call => [call.method, call.url]),
      [
        ["post", "/api/data-packages/101/import"],
        ["get", "/api/data-packages"]
      ]
    );
  });

  it("deletes one package and refreshes the server list", async () => {
    resetArmadaMockQueue([null, emptyPage()]);
    const state = useDataPackagePage();

    await state.removeDataPackage(dataPackageRow());

    assert.deepEqual(
      armadaCalls().map(call => [call.method, call.url]),
      [
        ["delete", "/api/data-packages/101"],
        ["get", "/api/data-packages"]
      ]
    );
  });
});
