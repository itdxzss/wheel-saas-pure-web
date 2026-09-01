import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { effect, stop } from "vue";
import {
  armadaCalls,
  resetArmadaMock
} from "@/api/__tests__/armada-test-double";
import { httpCalls, resetHttpMock } from "@/api/__tests__/http-test-double";
import * as marketingTemplatePage from "./useMarketingTemplatePage";

const { useMarketingTemplatePage } = marketingTemplatePage;

type PromotionLinkRow = {
  linkMode: "NORMAL" | "BUTTON" | "IMAGE_TEXT";
  promotionLink: string;
  buttons: Array<{
    type: "link" | "copy" | "quick";
    value: string;
  }>;
};

function displayPromotionLink(row: PromotionLinkRow): string {
  const moduleWithDisplayHelper =
    marketingTemplatePage as typeof marketingTemplatePage & {
      marketingTemplatePromotionLink?: (row: PromotionLinkRow) => string;
    };
  return (
    moduleWithDisplayHelper.marketingTemplatePromotionLink?.(row) ??
    "display-helper-missing"
  );
}

type LinkValidationMessage =
  | ""
  | "请输入跳转链接"
  | "请输入标准的跳转链接"
  | "validator-missing";

function validateLink(value: string): LinkValidationMessage {
  const moduleWithValidator =
    marketingTemplatePage as typeof marketingTemplatePage & {
      validateMarketingButtonLink?: (value: string) => LinkValidationMessage;
    };
  return (
    moduleWithValidator.validateMarketingButtonLink?.(value) ??
    "validator-missing"
  );
}

describe("marketing template page state", () => {
  it("shows the first link button URL for a button template", () => {
    assert.equal(
      displayPromotionLink({
        linkMode: "BUTTON",
        promotionLink: "",
        buttons: [
          { type: "copy", value: "VIP88" },
          { type: "link", value: "https://translate.google.com/" },
          { type: "link", value: "https://example.com/second" }
        ]
      }),
      "https://translate.google.com/"
    );
  });

  it("keeps the promotion link for a normal template", () => {
    assert.equal(
      displayPromotionLink({
        linkMode: "NORMAL",
        promotionLink: "https://example.com/promotion",
        buttons: [{ type: "link", value: "https://example.com/button" }]
      }),
      "https://example.com/promotion"
    );
  });

  it("starts a new template with one empty link button", () => {
    const pageState = useMarketingTemplatePage();

    pageState.openCreateDrawer();

    assert.deepEqual(
      pageState.templateForm.value.buttons.map(({ type, label, value }) => ({
        type,
        label,
        value
      })),
      [{ type: "link", label: "立即抢购", value: "" }]
    );
  });

  it("falls back to one empty link button when an old template has no buttons", async () => {
    resetArmadaMock({
      list: [
        {
          id: 7,
          templateName: "旧按钮模板",
          linkMode: 2,
          content: "标题",
          bodyText: "正文",
          buttons: []
        }
      ],
      total: 1,
      page: 1,
      pageSize: 10
    });
    const pageState = useMarketingTemplatePage();

    await pageState.refreshTemplates();
    await pageState.openEditDrawer(pageState.rows.value[0]);

    assert.deepEqual(
      pageState.templateForm.value.buttons.map(({ type, label, value }) => ({
        type,
        label,
        value
      })),
      [{ type: "link", label: "立即抢购", value: "" }]
    );
  });

  it("accepts standard marketing button links with or without a protocol", () => {
    for (const value of [
      "https://example.com/path?a=1&b=2#result",
      "http://example.com:8080/path",
      "www.example.com/path",
      "example.com/path?coupon=VIP_88"
    ]) {
      assert.equal(validateLink(value), "", value);
    }
  });

  it("returns the exact required message for an empty link", () => {
    assert.equal(validateLink(""), "请输入跳转链接");
    assert.equal(validateLink("   "), "请输入跳转链接");
  });

  it("returns the exact standard-link message for illegal input", () => {
    for (const value of [
      "not-a-url",
      "https://example.com/中文",
      "https://example.com/a b",
      "javascript:alert(1)",
      "ftp://example.com/file",
      "https://example.com/<script>"
    ]) {
      assert.equal(validateLink(value), "请输入标准的跳转链接", value);
    }
  });

  it("loads marketing templates with search and pagination params", async () => {
    resetArmadaMock({
      list: [
        {
          id: 7,
          templateName: "按钮模板",
          linkMode: 2,
          content: "标题",
          bodyText: "正文",
          buttons: [],
          promotionLink: "https://promo.example/vip"
        }
      ],
      total: 1,
      page: 2,
      pageSize: 20
    });
    const pageState = useMarketingTemplatePage();
    pageState.page.value = 2;
    pageState.pageSize.value = 20;
    pageState.searchForm.value.id = "7";
    pageState.searchForm.value.keyword = "按钮";
    pageState.searchForm.value.linkMode = "BUTTON";

    await pageState.refreshTemplates();

    assert.equal(pageState.rows.value.length, 1);
    assert.equal(pageState.rows.value[0].templateName, "按钮模板");
    assert.equal(pageState.rows.value[0].linkMode, "BUTTON");
    assert.equal(pageState.total.value, 1);
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

  it("maps image text link mode between backend and page state", async () => {
    resetArmadaMock({
      list: [
        {
          id: 12,
          templateName: "图文模板",
          linkMode: 3,
          content: "标题",
          bodyText: "正文",
          buttons: [],
          promotionLink: "https://promo.example/vip"
        }
      ],
      total: 1,
      page: 1,
      pageSize: 10
    });
    const pageState = useMarketingTemplatePage();
    pageState.searchForm.value.linkMode = "IMAGE_TEXT";

    await pageState.refreshTemplates();

    assert.equal(pageState.rows.value[0].linkMode, "IMAGE_TEXT");
    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/marketing-templates",
        opts: {
          params: {
            page: 1,
            pageSize: 10,
            id: undefined,
            keyword: undefined,
            textType: undefined,
            linkMode: 3
          }
        }
      }
    ]);
  });

  it("saves a new marketing template through the backend API", async () => {
    resetArmadaMock({
      list: [],
      total: 0,
      page: 1,
      pageSize: 10
    });
    const pageState = useMarketingTemplatePage();
    pageState.openCreateDrawer();
    pageState.templateForm.value.templateName = "新模板";
    pageState.templateForm.value.linkMode = "NORMAL";
    pageState.templateForm.value.content = "标题";
    pageState.templateForm.value.text = "正文";
    pageState.templateForm.value.promotionLink = "https://promo.example/vip";
    pageState.templateForm.value.mentionAll = true;

    await pageState.saveTemplate();

    assert.equal(pageState.drawerVisible.value, false);
    assert.deepEqual(
      armadaCalls().map(call => [call.method, call.url]),
      [
        ["post", "/api/marketing-templates"],
        ["get", "/api/marketing-templates"]
      ]
    );
    assert.equal(
      (armadaCalls()[0].opts as { data: { mentionAll: boolean } }).data
        .mentionAll,
      true
    );
  });

  it("saves a marketing template without optional text", async () => {
    resetArmadaMock({
      list: [],
      total: 0,
      page: 1,
      pageSize: 10
    });
    const pageState = useMarketingTemplatePage();
    pageState.openCreateDrawer();
    pageState.templateForm.value.templateName = "无文本模板";
    pageState.templateForm.value.linkMode = "NORMAL";
    pageState.templateForm.value.content = "标题";
    pageState.templateForm.value.text = "";
    pageState.templateForm.value.promotionLink = "https://promo.example/vip";

    await pageState.saveTemplate();

    const calls = armadaCalls();
    assert.equal(calls[0].method, "post");
    assert.equal(calls[0].url, "/api/marketing-templates");
    assert.equal(
      (calls[0].opts as { data: { bodyText: string } }).data.bodyText,
      ""
    );
    assert.equal(pageState.drawerVisible.value, false);
  });

  it("drops promotion link from button template payload", async () => {
    resetArmadaMock({
      list: [],
      total: 0,
      page: 1,
      pageSize: 10
    });
    const pageState = useMarketingTemplatePage();
    pageState.openCreateDrawer();
    pageState.templateForm.value.templateName = "按钮模板";
    pageState.templateForm.value.linkMode = "BUTTON";
    pageState.templateForm.value.content = "标题";
    pageState.templateForm.value.promotionLink = "https://promo.example/unused";
    pageState.templateForm.value.buttons = [
      {
        id: 1,
        type: "link",
        label: "访问",
        value: "https://button.example/open"
      }
    ];

    await pageState.saveTemplate();

    const calls = armadaCalls();
    assert.equal(
      (calls[0].opts as { data: { promotionLink: string | null } }).data
        .promotionLink,
      null
    );
  });

  it("keeps promotion link in image text template payload", async () => {
    resetArmadaMock({
      list: [],
      total: 0,
      page: 1,
      pageSize: 10
    });
    const pageState = useMarketingTemplatePage();
    pageState.openCreateDrawer();
    pageState.templateForm.value.templateName = "图文模板";
    pageState.templateForm.value.linkMode = "IMAGE_TEXT";
    pageState.templateForm.value.content = "标题";
    pageState.templateForm.value.promotionLink = "https://promo.example/image";

    await pageState.saveTemplate();

    const calls = armadaCalls();
    assert.equal(
      (calls[0].opts as { data: { promotionLink: string | null } }).data
        .promotionLink,
      "https://promo.example/image"
    );
  });

  it("allows an image text template without a promotion link", async () => {
    resetArmadaMock({
      list: [],
      total: 0,
      page: 1,
      pageSize: 10
    });
    const pageState = useMarketingTemplatePage();
    pageState.openCreateDrawer();
    pageState.templateForm.value.templateName = "无链接图文模板";
    pageState.templateForm.value.linkMode = "IMAGE_TEXT";
    pageState.templateForm.value.content = "标题";

    await pageState.saveTemplate();

    const calls = armadaCalls();
    assert.equal(calls[0].method, "post");
    assert.equal(
      (calls[0].opts as { data: { promotionLink: string | null } }).data
        .promotionLink,
      null
    );
  });

  it("ignores hidden invalid promotion URL in button mode", async () => {
    resetArmadaMock({
      list: [],
      total: 0,
      page: 1,
      pageSize: 10
    });
    const pageState = useMarketingTemplatePage();
    pageState.openCreateDrawer();
    pageState.templateForm.value.templateName = "按钮模板";
    pageState.templateForm.value.linkMode = "BUTTON";
    pageState.templateForm.value.content = "标题";
    pageState.templateForm.value.promotionLink = "not-a-url";
    pageState.templateForm.value.buttons = [
      {
        id: 1,
        type: "link",
        label: "访问",
        value: "https://button.example/open"
      }
    ];

    await pageState.saveTemplate();

    const calls = armadaCalls();
    assert.equal(calls[0].method, "post");
    assert.equal(
      (calls[0].opts as { data: { promotionLink: string | null } }).data
        .promotionLink,
      null
    );
    assert.equal(pageState.drawerVisible.value, false);
  });

  it("uploads selected image before saving template", async () => {
    resetArmadaMock({
      id: 99,
      url: "/api/marketing-template-files/99/content",
      originalFilename: "promo.png",
      contentType: "image/png",
      sizeBytes: 3
    });
    const pageState = useMarketingTemplatePage();
    pageState.openCreateDrawer();
    pageState.templateForm.value.templateName = "新模板";
    pageState.templateForm.value.linkMode = "NORMAL";
    pageState.templateForm.value.content = "标题";
    pageState.templateForm.value.text = "正文";
    pageState.templateForm.value.promotionLink = "https://promo.example/vip";
    pageState.templateForm.value.imageFile = new File(["png"], "promo.png", {
      type: "image/png"
    });

    await pageState.saveTemplate();

    const calls = armadaCalls();
    assert.equal(calls[0].method, "post");
    assert.equal(calls[0].url, "/api/marketing-template-files");
    assert.equal(calls[1].method, "post");
    assert.equal(calls[1].url, "/api/marketing-templates");
    assert.equal(
      (calls[1].opts as { data: { imageFileId: number } }).data.imageFileId,
      99
    );
  });

  it("loads persisted preview image through authorized blob request", async () => {
    resetArmadaMock({
      list: [
        {
          id: 7,
          templateName: "带图模板",
          linkMode: 1,
          imageFileId: 88,
          content: "标题",
          bodyText: "正文",
          buttons: [],
          promotionLink: "https://promo.example/vip"
        }
      ],
      total: 1,
      page: 1,
      pageSize: 10
    });
    resetHttpMock(new Blob(["png"], { type: "image/png" }));
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: () => "blob:marketing-template-88"
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: () => undefined
    });
    const pageState = useMarketingTemplatePage();
    const observedImageUrls: string[] = [];
    const imageRenderEffect = effect(() => {
      observedImageUrls.push(pageState.templateForm.value.imageUrl);
    });

    try {
      await pageState.refreshTemplates();
      await pageState.openPreviewDrawer(pageState.rows.value[0]);

      assert.equal(
        pageState.templateForm.value.imageUrl,
        "blob:marketing-template-88"
      );
      assert.equal(
        observedImageUrls[observedImageUrls.length - 1],
        "blob:marketing-template-88"
      );
      assert.deepEqual(httpCalls(), [
        {
          method: "get",
          url: "/api/marketing-template-files/88/content",
          opts: { responseType: "blob" }
        }
      ]);
    } finally {
      stop(imageRenderEffect);
      Object.defineProperty(URL, "createObjectURL", {
        configurable: true,
        value: originalCreateObjectURL
      });
      Object.defineProperty(URL, "revokeObjectURL", {
        configurable: true,
        value: originalRevokeObjectURL
      });
    }
  });

  it("rejects invalid promotion URL before saving", async () => {
    resetArmadaMock({
      list: [],
      total: 0,
      page: 1,
      pageSize: 10
    });
    const pageState = useMarketingTemplatePage();
    pageState.openCreateDrawer();
    pageState.templateForm.value.templateName = "新模板";
    pageState.templateForm.value.linkMode = "NORMAL";
    pageState.templateForm.value.content = "标题";
    pageState.templateForm.value.text = "正文";
    pageState.templateForm.value.promotionLink = "not-a-url";

    await pageState.saveTemplate();

    assert.deepEqual(armadaCalls(), []);
    assert.equal(pageState.drawerVisible.value, true);
  });

  it("rejects invalid link button URL before saving", async () => {
    resetArmadaMock({
      list: [],
      total: 0,
      page: 1,
      pageSize: 10
    });
    const pageState = useMarketingTemplatePage();
    pageState.openCreateDrawer();
    pageState.templateForm.value.templateName = "新模板";
    pageState.templateForm.value.linkMode = "BUTTON";
    pageState.templateForm.value.content = "标题";
    pageState.templateForm.value.text = "正文";
    pageState.templateForm.value.promotionLink = "https://promo.example/vip";
    pageState.templateForm.value.buttons = [
      { id: 1, type: "link", label: "访问", value: "abc" }
    ];

    await pageState.saveTemplate();

    assert.deepEqual(armadaCalls(), []);
    assert.equal(pageState.drawerVisible.value, true);
  });

  it("rejects button template without buttons before saving", async () => {
    resetArmadaMock({
      list: [],
      total: 0,
      page: 1,
      pageSize: 10
    });
    const pageState = useMarketingTemplatePage();
    pageState.openCreateDrawer();
    pageState.templateForm.value.templateName = "新模板";
    pageState.templateForm.value.linkMode = "BUTTON";
    pageState.templateForm.value.content = "标题";
    pageState.templateForm.value.text = "正文";
    pageState.templateForm.value.promotionLink = "https://promo.example/vip";
    pageState.templateForm.value.buttons = [];

    await pageState.saveTemplate();

    assert.deepEqual(armadaCalls(), []);
    assert.equal(pageState.drawerVisible.value, true);
  });

  it("clones and batch deletes selected marketing templates", async () => {
    resetArmadaMock({
      list: [],
      total: 0,
      page: 1,
      pageSize: 10
    });
    const pageState = useMarketingTemplatePage();
    pageState.onSelectionChange([
      {
        id: 7,
        templateName: "模板",
        linkMode: "NORMAL",
        promotionLink: "",
        content: "标题",
        text: "正文",
        mentionAll: false,
        buttons: []
      }
    ]);

    await pageState.cloneSelected();
    pageState.onSelectionChange([
      {
        id: 7,
        templateName: "模板",
        linkMode: "NORMAL",
        promotionLink: "",
        content: "标题",
        text: "正文",
        mentionAll: false,
        buttons: []
      }
    ]);
    await pageState.deleteSelected();

    assert.deepEqual(
      armadaCalls().map(call => [call.method, call.url]),
      [
        ["post", "/api/marketing-templates/7/clone"],
        ["get", "/api/marketing-templates"],
        ["post", "/api/marketing-templates/batch-delete"],
        ["get", "/api/marketing-templates"]
      ]
    );
  });
});
