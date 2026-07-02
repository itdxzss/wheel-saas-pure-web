import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import {
  batchDeleteMarketingTemplates,
  cloneMarketingTemplate,
  createMarketingTemplate,
  listMarketingTemplates,
  updateMarketingTemplate
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

  it("creates and updates marketing templates with backend button payloads", async () => {
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
        { type: "phone" as const, label: "联系", value: "+8613800138000" },
        { type: "quick" as const, label: "我要参加", value: "" }
      ],
      promotionLink: "https://promo.example/vip",
      remark: "备注"
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
              { type: "LINK_JUMP", text: "联系", param: "+8613800138000" },
              { type: "QUICK_REPLY", text: "我要参加", param: null }
            ],
            promotionLink: "https://promo.example/vip",
            remark: "备注"
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
              { type: "LINK_JUMP", text: "联系", param: "+8613800138000" },
              { type: "QUICK_REPLY", text: "我要参加", param: null }
            ],
            promotionLink: "https://promo.example/vip",
            remark: "备注"
          }
        }
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
