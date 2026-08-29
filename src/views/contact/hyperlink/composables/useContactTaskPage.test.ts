import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./useContactTaskPage.ts", import.meta.url),
  "utf8"
);

describe("contact task page composable", () => {
  it("sends only the filled search fields", () => {
    assert.match(source, /name: searchName\.value\.trim\(\) \|\| undefined/);
    assert.match(source, /runStatus: searchRunStatus\.value \?\? undefined/);
  });

  it("returns to page one whenever the query changes", () => {
    assert.match(source, /function search\(\) \{\s*\n\s*page\.value = 1;/);
    assert.match(source, /function changePageSize[\s\S]*?page\.value = 1;/);
  });

  it("routes create and edit to the right endpoint", () => {
    assert.match(source, /drawerMode\.value === "edit" && drawerDetail\.value/);
    assert.match(source, /updateContactTask\(drawerDetail\.value\.id, body\)/);
    assert.match(source, /createContactTask\(body\)/);
  });

  it("reloads the list after a successful write or action", () => {
    assert.match(source, /message\("保存成功"[\s\S]*?await load\(\)/);
    assert.match(source, /message\("操作成功"[\s\S]*?await load\(\)/);
  });

  it("surfaces every failure instead of failing silently", () => {
    const catches = source.match(/catch \(error\)/g) ?? [];
    assert.ok(catches.length >= 4);
    assert.doesNotMatch(source, /catch \{\s*\}/);
  });

  it("never exposes a delete action", () => {
    assert.doesNotMatch(source, /deleteContactTask/);
  });

  it("leaves the matched account count undefined until a real estimate exists", () => {
    // 没有试算接口就不显示计数，比显示一个编的数字好
    assert.match(
      source,
      /matchedAccountCount = ref<number \| undefined>\(undefined\)/
    );
    assert.match(source, /后端暂未提供试算接口/);
  });
});
