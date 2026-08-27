import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HYPERLINK_TEMPLATE_IMAGE_MAX_BYTES,
  createEmptyHyperlinkTemplateForm,
  toHyperlinkTemplateUpdateRequest,
  toHyperlinkTemplateWriteRequest,
  validateHyperlinkImageFile,
  validateHyperlinkTemplateForm
} from "./template-form";

describe("hyperlink template form contract", () => {
  it("normalizes single-link preview content with strict null semantics", () => {
    const form = createEmptyHyperlinkTemplateForm();
    Object.assign(form, {
      name: "  单图文模板  ",
      title: "  新品福利  ",
      content: "  查看活动  ",
      linkDescription: "  活动详情  ",
      promotionLink: "  https://example.com/promo  ",
      assetId: 12,
      remark: "   "
    });

    assert.equal(validateHyperlinkTemplateForm(form), "");
    assert.deepEqual(toHyperlinkTemplateWriteRequest(form), {
      name: "单图文模板",
      schemaVersion: 1,
      messageType: 1,
      title: "新品福利",
      content: "查看活动",
      linkDescription: "活动详情",
      promotionLink: "https://example.com/promo",
      buttons: [],
      cardText: null,
      linkPreviewAssetId: 12,
      bodyMainAssetId: null,
      remark: null
    });
  });

  it("builds one CTA URL button and sends the complete update object", () => {
    const form = createEmptyHyperlinkTemplateForm();
    Object.assign(form, {
      name: "卡片模板",
      messageType: 4,
      title: "新品福利",
      content: "",
      linkDescription: "必须清空",
      promotionLink: "https://ignored.example",
      cardText: "查看更多",
      assetId: 88,
      remark: "默认模板",
      version: 3
    });
    form.button = {
      displayText: "立即查看",
      targetValue: "https://example.com/card",
      useShortLink: false
    };

    assert.equal(validateHyperlinkTemplateForm(form), "");
    assert.deepEqual(toHyperlinkTemplateUpdateRequest(form), {
      version: 3,
      name: "卡片模板",
      schemaVersion: 1,
      messageType: 4,
      title: "新品福利",
      content: null,
      linkDescription: null,
      promotionLink: null,
      buttons: [
        {
          type: "CTA_URL",
          displayText: "立即查看",
          targetValue: "https://example.com/card",
          useShortLink: false,
          sort: 1
        }
      ],
      cardText: "查看更多",
      linkPreviewAssetId: null,
      bodyMainAssetId: 88,
      remark: "默认模板"
    });
  });

  it("rejects message type 2 locally", () => {
    const form = createEmptyHyperlinkTemplateForm();
    form.messageType = 2;

    assert.equal(validateHyperlinkTemplateForm(form), "一期暂不支持双图文");
    assert.throws(
      () => toHyperlinkTemplateWriteRequest(form),
      /一期暂不支持双图文/
    );
  });

  it("validates required fields and absolute http URLs by message type", () => {
    const form = createEmptyHyperlinkTemplateForm();
    Object.assign(form, {
      name: "普通按钮",
      messageType: 3,
      title: "标题",
      content: "",
      assetId: null
    });
    form.button.displayText = "查看";
    form.button.targetValue = "javascript:alert(1)";

    assert.equal(
      validateHyperlinkTemplateForm(form),
      "请输入合法的 http/https 按钮跳转链接"
    );
    form.button.targetValue = "https://example.com";
    assert.equal(validateHyperlinkTemplateForm(form), "");
  });

  it("checks JPEG extension, MIME, size and file markers before upload", async () => {
    const jpeg = new File(
      [new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0xff, 0xd9])],
      "promo.jpg",
      { type: "image/jpeg" }
    );
    const disguisedPng = new File(["not jpeg"], "promo.jpg", {
      type: "image/jpeg"
    });
    const tooLarge = new File(
      [new Uint8Array(HYPERLINK_TEMPLATE_IMAGE_MAX_BYTES + 1)],
      "large.jpeg",
      { type: "image/jpeg" }
    );

    assert.deepEqual(await validateHyperlinkImageFile(jpeg), {
      valid: true,
      message: ""
    });
    assert.equal((await validateHyperlinkImageFile(disguisedPng)).valid, false);
    assert.equal(
      (await validateHyperlinkImageFile(tooLarge)).message,
      "图片不能超过 500KB"
    );
  });
});
