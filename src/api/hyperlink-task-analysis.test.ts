import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./hyperlink-task-analysis.ts", import.meta.url),
  "utf8"
);

describe("H6 analysis API contract", () => {
  it("uses the frozen tenant endpoints and shared asynchronous export shell", () => {
    assert.match(source, /\/api\/hyperlink-tasks\/\$\{taskId\}\/clicks/);
    assert.match(source, /\/api\/hyperlink-tasks\/\$\{taskId\}\/visit-trend/);
    assert.match(source, /\/api\/hyperlink-tasks\/\$\{taskId\}\/ban-stats/);
    assert.match(source, /click-attribution\/export/);
    assert.match(source, /visit-trend\/export/);
    assert.match(source, /\/api\/hyperlink-task-exports\/\$\{jobId\}/);
    assert.match(source, /waitForHyperlinkTaskExport/);
    assert.match(source, /responseType: "blob"/);
  });

  it("models nullable PV buckets and masked sensitive fields explicitly", () => {
    assert.match(source, /pv: number \| null/);
    assert.match(source, /pvBucketMode/);
    assert.match(source, /maskedFields: string\[\]/);
    assert.match(source, /userAgent: string \| null/);
  });
});
