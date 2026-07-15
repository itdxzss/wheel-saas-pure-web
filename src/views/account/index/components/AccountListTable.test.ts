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

describe("AccountListTable protocol restart button", () => {
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
    assert.match(composableSource, /ElMessageBox\.alert/);
    assert.match(composableSource, /勾选的账号存在非正常状态的WS账号，请审核/);
    assert.match(composableSource, /ElMessageBox\.confirm/);
    assert.match(composableSource, /exportTenantAccountWsPhones/);
    assert.match(composableSource, /downloadBlobFile/);
    assert.match(
      composableSource,
      /导出成功，共导出\$\{result\.exportedCount\}个WS号码。/
    );
  });
});
