import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createEmptyHyperlinkTemplateForm,
  hyperlinkMessageTypeOptions,
  toHyperlinkTemplateUpdateRequest,
  toHyperlinkTemplateWriteRequest,
  validateHyperlinkTemplateForm
} from "./template-form";

describe("hyperlink template form contract", () => {
  it("starts with the competitor default normal button and type order", () => {
    const form = createEmptyHyperlinkTemplateForm();

    assert.equal(form.messageType, 3);
    assert.deepEqual(
      hyperlinkMessageTypeOptions.map(option => option.value),
      [3, 4, 1]
    );
    assert.equal(form.button.displayText, "立即查看");
    assert.equal(form.button.targetValue, "https://example.com/promo");
    assert.equal(form.button.useShortLink, false);
  });

  it("normalizes single-link preview content with strict null semantics", () => {
    const form = createEmptyHyperlinkTemplateForm();
    Object.assign(form, {
      name: "  单图文模板  ",
      messageType: 1,
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

  it("allows a single-link preview without a promotion link", () => {
    const form = createEmptyHyperlinkTemplateForm();
    Object.assign(form, {
      name: "单图文模板",
      messageType: 1,
      title: "新品福利",
      content: "查看活动",
      linkDescription: "活动详情",
      promotionLink: "   ",
      assetId: 12
    });

    assert.equal(validateHyperlinkTemplateForm(form), "");
    assert.equal(toHyperlinkTemplateWriteRequest(form).promotionLink, null);
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

  it("matches the 20-character interactive button text contract", () => {
    const form = createEmptyHyperlinkTemplateForm();
    form.name = "普通按钮";
    form.title = "标题";
    form.button.displayText = "按".repeat(20);

    assert.equal(validateHyperlinkTemplateForm(form), "");
    form.button.displayText += "钮";
    assert.equal(
      validateHyperlinkTemplateForm(form),
      "按钮文字不能超过 20 个字符"
    );
  });

  it("matches interactive body and footer limits", () => {
    const form = createEmptyHyperlinkTemplateForm();
    form.name = "普通按钮";
    form.title = "标题";
    form.content = "文".repeat(1024);

    assert.equal(validateHyperlinkTemplateForm(form), "");
    form.content += "字";
    assert.equal(
      validateHyperlinkTemplateForm(form),
      "底部小字不能超过 1024 个字符"
    );
    form.messageType = 4;
    form.content = "副".repeat(61);
    assert.equal(
      validateHyperlinkTemplateForm(form),
      "副标题不能超过 60 个字符"
    );
  });
});
