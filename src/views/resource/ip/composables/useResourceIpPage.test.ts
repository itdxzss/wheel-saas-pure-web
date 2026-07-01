import assert from "node:assert/strict";
import { describe, it } from "node:test";
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

    assert.deepEqual(page.allocationModeOptions, [
      { label: "智能分配(smart)", value: "smart" },
      { label: "混合国家(mixed)", value: "mixed" }
    ]);
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
      region: "印度",
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
