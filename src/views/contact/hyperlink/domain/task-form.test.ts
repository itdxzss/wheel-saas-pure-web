import { describe, expect, it } from "vitest";
import { emptyAccountFilterForm } from "./account-filter";
import {
  MESSAGE_TYPE_IMAGE,
  MESSAGE_TYPE_LINK,
  defaultTaskForm,
  toWriteRequest,
  validateTaskForm
} from "./task-form";

function linkForm() {
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

function imageForm() {
  return { ...defaultTaskForm(), name: "图文任务", content: "配图文案" };
}

describe("contact task form defaults", () => {
  it("matches the competitor defaults", () => {
    const form = defaultTaskForm();

    expect(form.messageType).toBe(MESSAGE_TYPE_IMAGE);
    expect(form.msgIntervalMinSec).toBe(0.5);
    expect(form.msgIntervalMaxSec).toBe(1);
    expect(form.concurrency).toBe(10);
    expect(form.maxSendsPerAccount).toBe(50);
    expect(form.retryMax).toBe(3);
    expect(form.startMode).toBe("now");
    expect(form.taskDelayMinutes).toBe(0);
    expect(form.isEnabled).toBe(1);
    expect(form.previewImageFileId).toBeNull();
  });
});

describe("contact task form validation", () => {
  it("requires a name and a body", () => {
    expect(validateTaskForm({ ...imageForm(), name: "  " })).toContain(
      "任务名称不能为空"
    );
    expect(validateTaskForm({ ...imageForm(), content: "" })).toContain(
      "正文内容不能为空"
    );
  });

  it("requires the three link fields only for link messages", () => {
    const errors = validateTaskForm({
      ...linkForm(),
      title: "",
      promotionLink: ""
    });

    expect(errors).toContain("消息标题不能为空");
    expect(errors).toContain("推广链接不能为空");
    expect(validateTaskForm(imageForm())).toEqual([]);
  });

  it("rejects a scheduled task with zero delay only when it is being enabled", () => {
    const scheduled = {
      ...imageForm(),
      startMode: "scheduled" as const,
      taskDelayMinutes: 0
    };

    expect(validateTaskForm({ ...scheduled, isEnabled: 1 })).toContain(
      "延迟时间需大于 0 分钟"
    );
    // 存草稿允许：竞品也是只在启用时才拦
    expect(validateTaskForm({ ...scheduled, isEnabled: 0 })).toEqual([]);
  });

  it("blocks enabling when the filter matches no account", () => {
    expect(
      validateTaskForm(
        { ...imageForm(), isEnabled: 1 },
        { matchedAccountCount: 0 }
      )
    ).toContain("账号范围未命中任何账号，无法启用");
  });

  it("allows saving a draft that matches no account", () => {
    expect(
      validateTaskForm(
        { ...imageForm(), isEnabled: 0 },
        { matchedAccountCount: 0 }
      )
    ).toEqual([]);
  });

  it("enforces the numeric ranges", () => {
    expect(validateTaskForm({ ...imageForm(), concurrency: 0 })).toContain(
      "最大执行账号数需在 1~200 之间"
    );
    expect(validateTaskForm({ ...imageForm(), retryMax: 11 })).toContain(
      "失败重试次数需在 0~10 之间"
    );
    expect(
      validateTaskForm({ ...imageForm(), maxSendsPerAccount: -1 })
    ).toContain("每号最大发送数不能为负");
  });
});

describe("contact task write request", () => {
  it("blanks the link fields for an image message", () => {
    const body = toWriteRequest(imageForm(), emptyAccountFilterForm());

    expect(body.title).toBe("");
    expect(body.description).toBe("");
    expect(body.promotionLink).toBe("");
  });

  it("maps linkDescription onto the backend description field", () => {
    const body = toWriteRequest(linkForm(), emptyAccountFilterForm());

    expect(body.description).toBe("一句话补充");
  });

  it("forces the delay to zero in immediate mode", () => {
    const body = toWriteRequest(
      { ...imageForm(), startMode: "now", taskDelayMinutes: 45 },
      emptyAccountFilterForm()
    );

    expect(body.taskDelayMinutes).toBe(0);
  });

  it("sends the account filter as a json string, not an object", () => {
    const body = toWriteRequest(imageForm(), emptyAccountFilterForm());

    expect(typeof body.accountFilterJson).toBe("string");
    expect(body.accountFilterJson).toBe("{}");
  });

  it("normalizes the interval to one decimal and keeps max above min", () => {
    const body = toWriteRequest(
      { ...imageForm(), msgIntervalMinSec: 3.04, msgIntervalMaxSec: 1 },
      emptyAccountFilterForm()
    );

    expect(body.msgIntervalMinSec).toBe(3);
    expect(body.msgIntervalMaxSec).toBe(3);
  });

  it("carries the uploaded preview image id", () => {
    const body = toWriteRequest(
      { ...imageForm(), previewImageFileId: 77 },
      emptyAccountFilterForm()
    );

    expect(body.previewImageFileId).toBe(77);
  });

  it("trims the name", () => {
    const body = toWriteRequest(
      { ...imageForm(), name: "  任务A  " },
      emptyAccountFilterForm()
    );

    expect(body.name).toBe("任务A");
  });
});
