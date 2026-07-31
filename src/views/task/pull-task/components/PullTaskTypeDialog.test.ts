import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const componentUrl = new URL("./PullTaskTypeDialog.vue", import.meta.url);
const indexSource = readFileSync(
  fileURLToPath(new URL("../index.vue", import.meta.url)),
  "utf8"
);

describe("pull task type selector", () => {
  it("offers ordinary pull and group marketing choices", () => {
    assert.ok(existsSync(fileURLToPath(componentUrl)));
    const source = readFileSync(fileURLToPath(componentUrl), "utf8");

    assert.match(source, /普通拉群/);
    assert.match(source, /拉群营销/);
    assert.match(source, /emit\(["']select["'], ["']STANDARD["']\)/);
    assert.match(source, /emit\(["']select["'], ["']GROUP_MARKETING["']\)/);
  });

  it("routes only the marketing choice to the standalone configuration page", () => {
    assert.match(indexSource, /<PullTaskTypeDialog/);
    assert.match(indexSource, /<PullTaskCreateDrawer/);
    assert.match(indexSource, /handleTaskTypeSelect/);
    assert.match(indexSource, /router\.push\("\/task\/pull-task\/create"\)/);
    assert.doesNotMatch(indexSource, /\/task\/group-marketing/);
  });
});
