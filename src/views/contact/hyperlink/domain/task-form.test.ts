import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyAccountFilterForm } from "./account-filter";
import {
  MESSAGE_TYPE_IMAGE,
  MESSAGE_TYPE_LINK,
  defaultTaskForm,
  toWriteRequest,
  validateTaskForm,
  type ContactTaskForm
} from "./task-form";

function linkForm(): ContactTaskForm {
  return {
    ...defaultTaskForm(),
    name: "春节福利",
    messageType: MESSAGE_TYPE_LINK,
    title: "限时领取",
    linkDescription: "一句话补充",
    promotionLink: "https://example.com/promo",
    content: "老朋友专享"
  };
}

function imageForm(): ContactTaskForm {
  return { ...defaultTaskForm(), name: "图文任务", content: "配图文案" };
}

describe("contact task form defaults", () => {
  it("matches the competitor defaults", () => {
    const form = defaultTaskForm();

    assert.equal(form.messageType, MESSAGE_TYPE_IMAGE);
    assert.equal(form.msgIntervalMinSec, 0.5);
    assert.equal(form.msgIntervalMaxSec, 1);
    assert.equal(form.concurrency, 10);
    assert.equal(form.maxSendsPerAccount, 50);
    assert.equal(form.retryMax, 3);
    assert.equal(form.startMode, "now");
    assert.equal(form.taskDelayMinutes, 0);
    assert.equal(form.isEnabled, 1);
    assert.equal(form.previewImageFileId, null);
  });
});

describe("contact task form validation", () => {
  it("requires a name and a body", () => {
    assert.ok(
      validateTaskForm({ ...imageForm(), name: "  " }).includes(
        "任务名称不能为空"
      )
    );
    assert.ok(
      validateTaskForm({ ...imageForm(), content: "" }).includes(
        "正文内容不能为空"
      )
    );
  });

  it("requires the three link fields only for link messages", () => {
    const errors = validateTaskForm({
      ...linkForm(),
      title: "",
      promotionLink: ""
    });

    assert.ok(errors.includes("消息标题不能为空"));
    assert.ok(errors.includes("推广链接不能为空"));
    assert.deepEqual(validateTaskForm(imageForm()), []);
  });

  it("rejects a scheduled task with zero delay only when it is being enabled", () => {
    const scheduled: ContactTaskForm = {
      ...imageForm(),
      startMode: "scheduled",
      taskDelayMinutes: 0
    };

    assert.ok(
      validateTaskForm({ ...scheduled, isEnabled: 1 }).includes(
        "延迟时间需大于 0 分钟"
      )
    );
    // 存草稿允许：竞品也是只在启用时才拦
    assert.deepEqual(validateTaskForm({ ...scheduled, isEnabled: 0 }), []);
  });

  it("blocks enabling when the filter matches no account", () => {
    assert.ok(
      validateTaskForm(
        { ...imageForm(), isEnabled: 1 },
        { matchedAccountCount: 0 }
      ).includes("账号范围未命中任何账号，无法启用")
    );
  });

  it("allows saving a draft that matches no account", () => {
    assert.deepEqual(
      validateTaskForm(
        { ...imageForm(), isEnabled: 0 },
        { matchedAccountCount: 0 }
      ),
      []
    );
  });

  it("enforces the numeric ranges", () => {
    assert.ok(
      validateTaskForm({ ...imageForm(), concurrency: 0 }).includes(
        "最大执行账号数需在 1~200 之间"
      )
    );
    assert.ok(
      validateTaskForm({ ...imageForm(), retryMax: 11 }).includes(
        "失败重试次数需在 0~10 之间"
      )
    );
    assert.ok(
      validateTaskForm({ ...imageForm(), maxSendsPerAccount: -1 }).includes(
        "每号最大发送数不能为负"
      )
    );
  });
});

describe("contact task write request", () => {
  it("blanks the link fields for an image message", () => {
    const body = toWriteRequest(imageForm(), emptyAccountFilterForm());

    assert.equal(body.title, "");
    assert.equal(body.description, "");
    assert.equal(body.promotionLink, "");
  });

  it("maps linkDescription onto the backend description field", () => {
    const body = toWriteRequest(linkForm(), emptyAccountFilterForm());

    assert.equal(body.description, "一句话补充");
  });

  it("forces the delay to zero in immediate mode", () => {
    const body = toWriteRequest(
      { ...imageForm(), startMode: "now", taskDelayMinutes: 45 },
      emptyAccountFilterForm()
    );

    assert.equal(body.taskDelayMinutes, 0);
  });

  it("sends the account filter as a json string, not an object", () => {
    const body = toWriteRequest(imageForm(), emptyAccountFilterForm());

    assert.equal(typeof body.accountFilterJson, "string");
    assert.equal(body.accountFilterJson, "{}");
  });

  it("normalizes the interval to one decimal and keeps max above min", () => {
    const body = toWriteRequest(
      { ...imageForm(), msgIntervalMinSec: 3.04, msgIntervalMaxSec: 1 },
      emptyAccountFilterForm()
    );

    assert.equal(body.msgIntervalMinSec, 3);
    assert.equal(body.msgIntervalMaxSec, 3);
  });

  it("carries the uploaded preview image id", () => {
    const body = toWriteRequest(
      { ...imageForm(), previewImageFileId: 77 },
      emptyAccountFilterForm()
    );

    assert.equal(body.previewImageFileId, 77);
  });

  it("trims the name", () => {
    const body = toWriteRequest(
      { ...imageForm(), name: "  任务A  " },
      emptyAccountFilterForm()
    );

    assert.equal(body.name, "任务A");
  });
});
