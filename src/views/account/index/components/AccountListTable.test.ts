import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const source = readFileSync(
  fileURLToPath(new URL("./AccountListTable.vue", import.meta.url)),
  "utf8"
);
const pageSource = readFileSync(
  fileURLToPath(new URL("../index.vue", import.meta.url)),
  "utf8"
);
const composableSource = readFileSync(
  fileURLToPath(
    new URL("../composables/useAccountListPage.ts", import.meta.url)
  ),
  "utf8"
);
const columnsSource = readFileSync(
  fileURLToPath(new URL("../constants.ts", import.meta.url)),
  "utf8"
);

function assertOrdered(content: string, markers: string[]): void {
  let previous = -1;
  for (const marker of markers) {
    const current = content.indexOf(marker);
    assert.ok(
      current > previous,
      `${marker} should follow the previous column`
    );
    previous = current;
  }
}

describe("AccountListTable protocol restart button", () => {
  it("places group, account status and login directly after account", () => {
    const orderedLabels = ["账号", "分组", "账号状态", "登录", "IP来源"];
    assertOrdered(
      columnsSource,
      orderedLabels.map(label => `{ label: "${label}"`)
    );
    const tableSource = source.slice(source.indexOf("<el-table"));
    assertOrdered(
      tableSource,
      orderedLabels.map(label => `label="${label}"`)
    );
  });

  it("shows a concrete-country flag beside the account and removes the country column", () => {
    assert.match(source, /v-if="row\.country_flag"/);
    assert.match(source, /\{\{ row\.country_flag \}\}/);
    assert.doesNotMatch(columnsSource, /label: "国家"/);
    assert.doesNotMatch(source, /label="国家"/);
  });

  it("exposes a loading restart button that emits restart-protocol", () => {
    assert.match(source, /protocolRestarting: boolean/);
    assert.match(source, /\(event: "restart-protocol"\): void/);
    assert.match(source, /重启协议/);
    assert.match(source, /:loading="protocolRestarting"/);
    assert.match(source, /emit\('restart-protocol'\)/);
  });

  it("names and guards the two lifecycle batch actions", () => {
    assert.match(source, />\s*批量登录\s*</);
    assert.match(source, />\s*批量离线\s*</);
    assert.match(source, /batchSubmitting: boolean/);
    assert.match(source, /:loading="batchSubmitting \|\| wsExporting"/);
  });

  it("wires the guarded WS phone export flow below takeover", () => {
    assert.match(
      source,
      /command="takeover"[\s\S]*command="export-ws-phones"[\s\S]*导出WS号[\s\S]*command="delete"/
    );
    assert.match(source, /wsExporting: boolean/);
    assert.match(
      source,
      /:disabled="selectedCount === 0 \|\| batchSubmitting \|\| wsExporting"/
    );
    assert.match(pageSource, /:ws-exporting="wsExporting"/);
    assert.match(composableSource, /analyzeWsPhoneExportSelection/);
    assert.doesNotMatch(composableSource, /勾选的账号存在非正常状态的WS账号：/);
    assert.match(composableSource, /ElMessageBox\.confirm/);
    assert.doesNotMatch(composableSource, /ElMessageBox\.alert/);
    assert.match(
      composableSource,
      /正常状态账号：\$\{analysis\.normalCount\}个/
    );
    assert.match(
      composableSource,
      /非正常状态账号：\$\{analysis\.abnormalCount\}个/
    );
    assert.match(
      composableSource,
      /本次预计导出 \$\{analysis\.normalCount \+ analysis\.abnormalCount\} 个WS号码。/
    );
    assert.match(
      composableSource,
      /本次预计导出 \$\{analysis\.normalCount\}个WS号码。/
    );
    assert.match(composableSource, /confirmButtonText: "确认导出"/);
    assert.match(composableSource, /cancelButtonText: "取消"/);
    assert.match(composableSource, /exportTenantAccountWsPhones/);
    assert.match(composableSource, /downloadBlobFile/);
    assert.match(
      composableSource,
      /导出成功，共导出\$\{result\.exportedCount\}个WS号码。/
    );
  });

  it("renders the group name as a colored occupancy tag without row requests", () => {
    assert.match(source, /marketingOccupancyMeta/);
    assert.match(source, /\(event: "group-click", row: TenantAccount\): void/);
    assert.match(source, /class="marketing-occupancy-tag"/);
    assert.match(source, /emit\('group-click', row as TenantAccount\)/);
    assert.doesNotMatch(source, /getAccountGroupMarketingOccupancy/);
    assert.match(pageSource, /@group-click="openMarketingOccupancy"/);
  });

  it("exposes the confirmed marketing occupancy filters", () => {
    assert.match(pageSource, /营销占用类型/);
    assert.match(pageSource, /占用任务/);
    assert.match(pageSource, /可调用状态/);
    assert.match(composableSource, /marketingOccupancyType/);
    assert.match(composableSource, /occupiedTaskKeyword/);
    assert.match(composableSource, /occupiedBusinessType/);
    assert.match(composableSource, /callable/);
  });
});
