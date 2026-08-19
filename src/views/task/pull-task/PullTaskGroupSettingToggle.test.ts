import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

function source(relativePath: string): string {
  return readFileSync(
    fileURLToPath(new URL(relativePath, import.meta.url)),
    "utf8"
  );
}

const groupSettingsSource = source(
  "./components/PullTaskStandardGroupSettings.vue"
);
const createStateSource = source("./composables/useStandardPullTaskCreate.ts");

/** 三个小块在模板里的 class 标识，顺序同原型：设置顺序 / 基础资料 / 权限控制。 */
const settingBlocks = ["timing-block", "profile-block", "permission-block"];

/** 「群信息设置」开关打开后必须照旧可填的字段标签。 */
const settingFieldLabels = [
  "设置顺序",
  "群名称（可选）",
  "料子文件名为群名",
  "群头像（可选）",
  "群描述（可选）",
  "是否任务完成后自动关闭禁言",
  "是否任务完成后自动关闭拉人权限",
  "允许任何人编辑群组设置",
  "群禁言",
  "获取群链接权限",
  "限时消息"
];

/**
 * 取出含指定内容的单个标签开头串（属性可跨行，但不含 `>`），
 * 这样断言不依赖属性书写顺序。
 */
function tagContaining(
  markup: string,
  tagName: string,
  needle: string
): string {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matched = markup.match(
    new RegExp(`<${tagName}\\b[^>]*${escaped}[^>]*>`)
  );
  assert.ok(matched, `未找到含 ${needle} 的 <${tagName}> 标签`);
  return matched[0];
}

/** 取出三个小块各自的 `<section>` 开标签。 */
function blockTag(blockClass: string): string {
  return tagContaining(groupSettingsSource, "section", blockClass);
}

describe("pull task group setting toggle", () => {
  it("opens the create surface with the switch off and the three blocks hidden", () => {
    assert.match(createStateSource, /groupSettingEnabled: false/);
    for (const blockClass of settingBlocks) {
      assert.match(blockTag(blockClass), /v-if="form\.groupSettingEnabled"/);
    }
  });

  it("reveals the three blocks with writable fields once the switch is turned on", () => {
    assert.match(groupSettingsSource, /<template #header>/);
    assert.match(groupSettingsSource, /群信息设置/);
    assert.match(
      tagContaining(groupSettingsSource, "el-switch", "groupSettingEnabled"),
      /v-model="form\.groupSettingEnabled"/
    );
    for (const blockClass of settingBlocks) {
      assert.match(blockTag(blockClass), /v-if="form\.groupSettingEnabled"/);
    }
    for (const label of settingFieldLabels) {
      assert.match(groupSettingsSource, new RegExp(label));
    }
    assert.doesNotMatch(
      groupSettingsSource,
      /:disabled="!form\.groupSettingEnabled"/
    );
  });

  it("hides the three blocks again when the switch is turned back off", () => {
    for (const blockClass of settingBlocks) {
      const tag = blockTag(blockClass);
      assert.match(tag, /v-if="form\.groupSettingEnabled"/);
      assert.doesNotMatch(tag, /v-show=/);
    }
    assert.doesNotMatch(
      groupSettingsSource,
      /v-show="form\.groupSettingEnabled"/
    );
    assert.doesNotMatch(
      groupSettingsSource,
      /const groupSettingEnabled\s*=\s*ref/
    );
  });

  // 「编辑已启动任务时开关要禁用」原本在这里。拉群任务没有编辑功能——列表只有启动、
  // 暂停、继续、结束、查看详情，后端也没有任何修改接口。该场景不存在，故不做断言，
  // 也不要为它发明编辑链路。将来真做了编辑，这条要补一个真正的行为测试。
  it("binds the switch to the shared form state instead of a local copy", () => {
    const switchTag = tagContaining(
      groupSettingsSource,
      "el-switch",
      "groupSettingEnabled"
    );
    assert.match(switchTag, /v-model="form\.groupSettingEnabled"/);
  });
});
