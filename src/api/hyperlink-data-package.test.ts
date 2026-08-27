import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMock,
  resetArmadaMockQueue
} from "./__tests__/armada-test-double";
import {
  createDataPackage,
  deleteDataPackage,
  getDataPackage,
  importDataPackagePhones,
  listDataPackageCountries,
  listDataPackagePhones,
  listDataPackages,
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
});
