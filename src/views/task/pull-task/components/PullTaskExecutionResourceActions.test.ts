import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const source = readFileSync(
  fileURLToPath(
    new URL("./PullTaskExecutionResourceActions.vue", import.meta.url)
  ),
  "utf8"
);

describe("normal-link single execution actions", () => {
  it("offers only state-valid pause, resume, end and resource supplements", () => {
    assert.match(source, /emit\('detail'\)/);
    assert.match(source, /查看明细/);
    assert.match(source, /manualPaused/);
    assert.match(source, /waitResourceType === 1/);
    assert.match(source, /waitResourceType === 2/);
    assert.match(source, /waitResourceType === 3/);
    assert.doesNotMatch(source, /reasonCode ===/);
    assert.match(source, /emit\('lifecycle', 'pause'\)/);
    assert.match(source, /emit\('lifecycle', 'resume'\)/);
    assert.match(source, /emit\('lifecycle', 'end'\)/);
    assert.match(source, /补充管理员/);
    assert.match(source, /补充拉手/);
    assert.match(source, /补充站台/);
    assert.doesNotMatch(source, /RESTART|重启|重试|复制/);
  });
});
