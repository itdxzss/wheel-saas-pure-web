import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./ContactTaskDrawer.vue", import.meta.url),
  "utf8"
);

describe("contact task drawer sections", () => {
  it("lays out the four competitor sections in order", () => {
    const order = ["基础信息", "消息内容", "发送策略", "发布"].map(title =>
      source.indexOf(title)
    );
    assert.ok(order.every(index => index > 0));
    assert.deepEqual(
      [...order].sort((a, b) => a - b),
      order
    );
  });

  it("numbers each section", () => {
    assert.match(source, /class="section-index">1</);
    assert.match(source, /class="section-index">4</);
  });

  it("keeps the live whatsapp preview beside the form", () => {
    assert.match(source, /<ContactTaskPreview/);
    assert.match(source, /:content="form\.content"/);
  });
});

describe("contact task drawer message content", () => {
  it("shows the three link fields only for link messages", () => {
    assert.match(source, /<template v-if="isLink">/);
    assert.match(source, /form\.title/);
    assert.match(source, /form\.linkDescription/);
    assert.match(source, /form\.promotionLink/);
  });

  it("maps the backend description field onto linkDescription when loading", () => {
    assert.match(source, /linkDescription: detail\.description \?\? ""/);
  });

  it("enforces the competitor image limits", () => {
    assert.match(source, /IMAGE_ACCEPT = "\.jpg,\.jpeg"/);
    assert.match(source, /IMAGE_MAX_BYTES = 500 \* 1024/);
    assert.match(source, /图片不能超过 500KB/);
  });

  it("says the image is optional for an image message", () => {
    assert.match(source, /不传则仅发送文字/);
  });

  it("lets the user remove a chosen image", () => {
    assert.match(source, /function clearImage/);
    assert.match(source, /form\.value\.previewImageFileId = null/);
  });
});

describe("contact task drawer send policy", () => {
  it("offers the four interval presets and highlights the active one", () => {
    assert.match(source, /INTERVAL_PRESETS/);
    assert.match(
      source,
      /activePreset === preset\.key \? 'primary' : 'default'/
    );
  });

  it("keeps one decimal on both interval inputs", () => {
    assert.match(source, /:precision="1"/);
    assert.match(source, /:step="0\.1"/);
  });

  it("bounds the slider and the inputs differently, like the competitor", () => {
    assert.match(source, /:max="INTERVAL_SLIDER_MAX"/);
    assert.match(source, /:max="INTERVAL_INPUT_MAX"/);
  });

  it("explains what the interval actually means", () => {
    assert.match(source, /同一个账号给两个好友发消息之间至少等待的秒数/);
    assert.match(source, /在区间内随机取值/);
  });

  it("normalizes the interval on blur and again before submitting", () => {
    assert.match(source, /@blur="normalizeIntervalInputs"/);
    assert.match(
      source,
      /function submit\(\) \{\s*\n\s*normalizeIntervalInputs\(\);/
    );
  });

  it("says that zero means every contact", () => {
    assert.match(source, /0 表示发给全部联系人/);
  });
});

describe("contact task drawer publish section", () => {
  it("uses two selectable cards rather than a bare switch", () => {
    assert.match(source, /class="status-toggle"/);
    assert.match(source, /form\.isEnabled = 1/);
    assert.match(source, /form\.isEnabled = 0/);
  });

  it("only asks for a delay in scheduled mode", () => {
    assert.match(source, /v-if="form\.startMode === 'scheduled'"/);
  });
});

describe("contact task drawer account range", () => {
  it("shows the live matched account count", () => {
    assert.match(source, /命中 \{\{ matchedAccountCount \}\} 个账号/);
  });

  it("flags an empty match only when the task is being enabled", () => {
    assert.match(
      source,
      /accountRangeError = computed\(\s*\n?\s*\(\) => form\.value\.isEnabled === 1 && props\.matchedAccountCount === 0/
    );
  });

  it("says a filter-free task means all valid accounts", () => {
    assert.match(source, /未限制，将使用全部有效账号/);
  });
});

describe("contact task drawer modes", () => {
  it("locks the message type while editing", () => {
    assert.match(
      source,
      /messageTypeLocked = computed\(\(\) => props\.mode === "edit"\)/
    );
    assert.match(source, /任务创建后消息类型不可更改/);
  });

  it("disables the whole form and hides save in view mode", () => {
    assert.match(
      source,
      /readonly = computed\(\(\) => props\.mode === "view"\)/
    );
    assert.match(source, /:disabled="readonly"/);
    assert.match(source, /v-if="!readonly"/);
  });

  it("validates through the shared domain rules instead of inline checks", () => {
    assert.match(source, /validateTaskForm\(form\.value/);
    assert.match(source, /toWriteRequest\(form\.value, filter\.value\)/);
  });
});
