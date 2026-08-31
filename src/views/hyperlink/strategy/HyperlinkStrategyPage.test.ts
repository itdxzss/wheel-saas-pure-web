import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");
const page = read("./index.vue");
const dialog = read("./components/HyperlinkStrategyDialog.vue");
const drawer = read("../task/components/HyperlinkAccountFilterDrawer.vue");

describe("hyperlink strategy page contract", () => {
  it("exposes CRUD, filters, versioned status changes and weak-reference copy", () => {
    for (const text of [
      "策略名称",
      "任务模式",
      "状态",
      "新建策略",
      "最大执行账号",
      "最大使用账号",
      "单号发送上限",
      "编辑",
      "删除"
    ]) {
      assert.ok(page.includes(text), text);
    }
    assert.match(page, /弱引用/);
    assert.match(page, /tenant:hyperlink_strategy:create/);
    assert.match(page, /tenant:hyperlink_strategy:edit/);
    assert.match(page, /tenant:hyperlink_strategy:delete/);
  });

  it("keeps strategy fields narrow and reuses the full account filter", () => {
    assert.match(dialog, /周期策略的执行间隔不能小于 30 分钟|下限为 30 分钟/);
    assert.match(dialog, /最大执行账号数/);
    assert.match(dialog, /<el-drawer/);
    assert.match(dialog, /before-close/);
    assert.match(dialog, /未保存的修改/);
    assert.match(dialog, /0 表示按账号和协议容量自动均分/);
    assert.match(dialog, /每账号最大发送数/);
    assert.doesNotMatch(dialog, /消息内容|数据包|启动时间|消息间隔/);
    assert.match(page, /HyperlinkAccountFilterDrawer/);
    assert.match(
      drawer,
      /props\.countAccounts \?\? countHyperlinkTaskAccounts/
    );
  });
});
