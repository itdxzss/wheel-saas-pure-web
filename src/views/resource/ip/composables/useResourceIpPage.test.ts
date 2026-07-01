import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { nextTick } from "vue";
import type { UploadRawFile } from "element-plus";
import {
  armadaCalls,
  resetArmadaMock
} from "@/api/__tests__/armada-test-double";
import type { IpProxyCheckResult } from "@/api/resource-ip";
import type { IpManageRow } from "@/api/resource-ip-mapping";
import {
  createIpManageTableColumns,
  useResourceIpPage
} from "./useResourceIpPage";

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
} {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(nextResolve => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

function ipRow(id: number): IpManageRow {
  return {
    id,
    country: "印度",
    proxyType: "HTTP",
    proxyAddress: `proxy-${id}.example.com:8080`,
    username: "user",
    password: "pass",
    validAccountCount: 0,
    source: "IPide",
    createdAt: "2026-07-01 10:00:00"
  };
}

function setImportFile(page: ReturnType<typeof useResourceIpPage>, text: string) {
  const raw = {
    name: "ips.txt",
    text: async () => text
  } as unknown as UploadRawFile;
  page.uploadFiles.value = [
    {
      name: "ips.txt",
      status: "ready",
      uid: 1,
      raw
    }
  ];
}

describe("resource IP page state", () => {
  it("keeps IP management table columns aligned with the PRD list", () => {
    const columns = createIpManageTableColumns();

    assert.deepEqual(
      columns.map(column => String(column.label)),
      [
        "国家",
        "类型",
        "代理地址",
        "用户名",
        "密码",
        "IP来源（二期）",
        "有效账号",
        "创建时间"
      ]
    );
  });

  it("names mixed allocation as mixed country in the import dialog options", () => {
    const page = useResourceIpPage();

    assert.equal(page.importForm.value.allocationMode, "smart");
  });

  it("requires a passed import sample check before enabling import", () => {
    const page = useResourceIpPage();
    page.importForm.value.countryValue = "US";
    page.importForm.value.source = "iproyal";
    setImportFile(page, "1.1.1.1:8080:u:p");

    assert.equal(page.importCheckPassed.value, false);
    assert.equal(page.canSubmitImport.value, false);
  });

  it("marks import sample check as passed after successful check", async () => {
    resetArmadaMock({
      passed: true,
      sampleSize: 1,
      samples: [
        {
          lineNo: 1,
          host: "1.1.1.1",
          port: 8080,
          passed: true,
          connectionStatus: "success",
          whatsappStatus: "HTTP 400",
          outboundIp: "103.10.10.10",
          countryCode: "US",
          location: "United States",
          isp: "Example ISP",
          checkedAt: 1_719_800_000_000,
          errorMessage: null
        }
      ],
      errors: []
    });
    const page = useResourceIpPage();
    page.importForm.value.countryValue = "US";
    page.importForm.value.source = "iproyal";
    setImportFile(page, "1.1.1.1:8080:u:p");

    await page.sampleCheckImport();

    assert.equal(page.showImportSampleCheckDialog.value, true);
    assert.equal(page.importCheckPassed.value, true);
    assert.equal(page.importCheckResult.value?.samples[0].whatsappStatus, "HTTP 400");
    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/ip-proxies/import/sample-check",
        opts: {
          data: {
            allocationMode: "smart",
            countryValue: "US",
            protocol: 1,
            source: "iproyal",
            text: "1.1.1.1:8080:u:p"
          }
        },
        config: { timeout: 120000 }
      }
    ]);
  });

  it("clears import sample-check pass when import inputs change", async () => {
    const page = useResourceIpPage();
    page.importCheckPassed.value = true;

    page.importForm.value.source = "changed";
    await nextTick();

    assert.equal(page.importCheckPassed.value, false);
  });

  it("ignores stale import sample-check response after import inputs change", async () => {
    const pending = deferred<{
      passed: boolean;
      sampleSize: number;
      samples: never[];
      errors: string[];
    }>();
    resetArmadaMock(pending.promise);
    const page = useResourceIpPage();
    page.importForm.value.countryValue = "US";
    page.importForm.value.source = "iproyal";
    setImportFile(page, "1.1.1.1:8080:u:p");
    await nextTick();

    const checking = page.sampleCheckImport();
    assert.equal(page.showImportSampleCheckDialog.value, true);
    assert.equal(page.importChecking.value, true);

    page.importForm.value.source = "changed";
    await nextTick();
    pending.resolve({ passed: true, sampleSize: 1, samples: [], errors: [] });
    await checking;

    assert.equal(page.importCheckPassed.value, false);
    assert.equal(page.importCheckResult.value, null);
    assert.equal(page.canSubmitImport.value, false);
  });

  it("opens the single-check dialog immediately and blocks other checks while pending", async () => {
    const pending = deferred<IpProxyCheckResult>();
    resetArmadaMock(pending.promise);
    const page = useResourceIpPage();

    const firstCheck = page.checkSingleIp(ipRow(1));

    assert.equal(page.showCheckResultDialog.value, true);
    assert.equal(page.checkDialogLoading.value, true);
    assert.equal(page.activeCheckRow.value?.id, 1);
    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/ip-proxies/1/check",
        opts: undefined,
        config: { timeout: 20000 }
      }
    ]);

    await page.checkSingleIp(ipRow(2));
    assert.equal(armadaCalls().length, 1);

    const result: IpProxyCheckResult = {
      id: 1,
      checkStatus: "success",
      connectionStatus: "空闲",
      whatsappStatus: "HTTP 400",
      outboundIp: "47.15.30.133",
      countryCode: "IN",
      detectedRegion: "印度",
      region: "美国",
      location: "India(IN) · Haryana · Sonipat",
      isp: "Reliance Jio Infocomm Limited",
      detectedLatitude: 28.9933,
      detectedLongitude: 77.021,
      checkedAt: 1782871200000,
      errorMessage: null
    };
    pending.resolve(result);
    await firstCheck;

    assert.equal(page.checkDialogLoading.value, false);
    assert.deepEqual(page.checkResults.value, [result]);
  });
});
