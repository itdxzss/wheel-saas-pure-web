import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import { httpCalls, resetHttpMock } from "./__tests__/http-test-double";
import {
  batchDeleteMarketingTemplates,
  cloneMarketingTemplate,
  createMarketingTemplate,
  downloadMarketingTemplateImage,
  listMarketingTemplates,
  marketingTemplateImageUrl,
  updateMarketingTemplate,
  uploadMarketingTemplateImage
} from "./marketing-template";

describe("marketing template API", () => {
  it("maps marketing template list params and response buttons", async () => {
    resetArmadaMock({
      list: [
        {
          id: 7,
          templateName: "按钮模板",
          linkMode: 2,
          textType: "PROMO",
          imageFileId: null,
          content: "标题",
          bodyText: "正文",
          buttons: [
            { type: "COPY_CONTENT", text: "复制优惠码", param: "VIP88" }
          ],
          promotionLink: "https://promo.example/vip",
          remark: "备注",
          createdAt: 1782871200000,
          updatedAt: 1782871300000
        }
      ],
      total: 1,
      page: 2,
      pageSize: 20
    });

    const result = await listMarketingTemplates({
      page: 2,
      pageSize: 20,
      id: 7,
      keyword: "按钮",
      linkMode: 2
    });

    assert.equal(result.list?.[0].buttons[0].type, "copy");
    assert.equal(result.list?.[0].mentionAll, false);
    assert.equal(result.total, 1);
    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/marketing-templates",
        opts: {
          params: {
            page: 2,
            pageSize: 20,
            id: 7,
            keyword: "按钮",
            textType: undefined,
            linkMode: 2
          }
        }
      }
    ]);
  });

  it("creates and updates button templates without promotion link payloads", async () => {
    resetArmadaMock({
      id: 8,
      templateName: "新模板",
      linkMode: 2,
      content: "标题",
      bodyText: "正文",
      buttons: [],
      promotionLink: "https://promo.example/vip"
    });

    const payload = {
      templateName: "新模板",
      linkMode: 2 as const,
      textType: "PROMO",
      imageFileId: null,
      content: "标题",
      bodyText: "正文",
      buttons: [
        { type: "link" as const, label: "访问", value: "https://a.example" },
        { type: "copy" as const, label: "复制", value: "VIP88" },
        { type: "quick" as const, label: "我要参加", value: "" }
      ],
      promotionLink: "https://promo.example/vip",
      remark: "备注",
      mentionAll: true
    };

    await createMarketingTemplate(payload);
    await updateMarketingTemplate(8, payload);

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/marketing-templates",
        opts: {
          data: {
            templateName: "新模板",
            linkMode: 2,
            textType: "PROMO",
            imageFileId: null,
            content: "标题",
            bodyText: "正文",
            buttons: [
              { type: "LINK_JUMP", text: "访问", param: "https://a.example" },
              { type: "COPY_CONTENT", text: "复制", param: "VIP88" },
              { type: "QUICK_REPLY", text: "我要参加", param: null }
            ],
            promotionLink: null,
            remark: "备注",
            mentionAll: true
          }
        }
      },
      {
        method: "put",
        url: "/api/marketing-templates/8",
        opts: {
          data: {
            templateName: "新模板",
            linkMode: 2,
            textType: "PROMO",
            imageFileId: null,
            content: "标题",
            bodyText: "正文",
            buttons: [
              { type: "LINK_JUMP", text: "访问", param: "https://a.example" },
              { type: "COPY_CONTENT", text: "复制", param: "VIP88" },
              { type: "QUICK_REPLY", text: "我要参加", param: null }
            ],
            promotionLink: null,
            remark: "备注",
            mentionAll: true
          }
        }
      }
    ]);
  });

  it("creates image text templates without backend buttons", async () => {
    resetArmadaMock({
      id: 10,
      templateName: "图文模板",
      linkMode: 3,
      content: "标题",
      bodyText: "正文",
      buttons: []
    });

    await createMarketingTemplate({
      templateName: "图文模板",
      linkMode: 3,
      textType: "PROMO",
      imageFileId: null,
      content: "标题",
      bodyText: "正文",
      buttons: [{ type: "quick", label: "不应发送", value: "" }],
      promotionLink: "https://promo.example/vip",
      remark: null
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/marketing-templates",
        opts: {
          data: {
            templateName: "图文模板",
            linkMode: 3,
            textType: "PROMO",
            imageFileId: null,
            content: "标题",
            bodyText: "正文",
            mentionAll: false,
            buttons: [],
            promotionLink: "https://promo.example/vip",
            remark: null
          }
        }
      }
    ]);
  });

  it("uploads marketing template images as multipart form data", async () => {
    resetArmadaMock({
      id: 99,
      originalFilename: "promo.png",
      contentType: "image/png",
      sizeBytes: 3,
      url: "/api/marketing-template-files/99/content"
    });

    const file = new File(["png"], "promo.png", { type: "image/png" });
    const result = await uploadMarketingTemplateImage(file);

    assert.equal(result.id, 99);
    assert.equal(
      marketingTemplateImageUrl(99),
      "/api/marketing-template-files/99/content"
    );
    const [call] = armadaCalls();
    assert.equal(call.method, "post");
    assert.equal(call.url, "/api/marketing-template-files");
    assert.ok(
      (call.opts as { data: FormData }).data.get("file") instanceof File
    );

    const headers = { "Content-Type": "application/json" };
    (
      call.config as {
        beforeRequestCallback: (config: { headers: typeof headers }) => void;
      }
    ).beforeRequestCallback({ headers });
    assert.deepEqual(headers, {});
  });

  it("downloads marketing template images through the authorized http client", async () => {
    const blob = new Blob(["png"], { type: "image/png" });
    resetHttpMock(blob);

    const result = await downloadMarketingTemplateImage(88);

    assert.equal(result, blob);
    assert.deepEqual(httpCalls(), [
      {
        method: "get",
        url: "/api/marketing-template-files/88/content",
        opts: { responseType: "blob" }
      }
    ]);
  });

  it("clones and batch deletes marketing templates", async () => {
    resetArmadaMock({
      id: 9,
      templateName: "副本",
      linkMode: 1,
      content: "标题",
      bodyText: "正文",
      buttons: []
    });

    await cloneMarketingTemplate(7);
    await batchDeleteMarketingTemplates([7, 8]);

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/marketing-templates/7/clone",
        opts: undefined
      },
      {
        method: "post",
        url: "/api/marketing-templates/batch-delete",
        opts: { data: { ids: [7, 8] } }
      }
    ]);
  });
});
