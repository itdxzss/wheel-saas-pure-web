import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./ContactTaskSearchCard.vue", import.meta.url),
  "utf8"
);

describe("contact task search card", () => {
  it("offers the three competitor search dimensions", () => {
    assert.match(source, /任务名称/);
    assert.match(source, /状态/);
    assert.match(source, /创建时间/);
  });

  it("drives the status dropdown from the shared status options", () => {
    // 不在模板里硬编码五个状态，否则和列表页的口径迟早分裂
    assert.match(source, /RUN_STATUS_OPTIONS/);
    assert.doesNotMatch(source, /进行中/);
  });

  it("uses an epoch millisecond range so it matches the backend query", () => {
    assert.match(source, /type="datetimerange"/);
    assert.match(source, /value-format="x"/);
  });

  it("searches on enter as well as on the button", () => {
    assert.match(source, /@keyup\.enter="emit\('search'\)"/);
  });
});
