import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMock
} from "@/api/__tests__/armada-test-double";
import {
  httpCalls,
  resetHttpMock
} from "@/api/__tests__/http-test-double";
import { useMarketingTemplatePage } from "./useMarketingTemplatePage";

describe("marketing template page state", () => {
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

    await pageState.saveTemplate();

    assert.equal(pageState.drawerVisible.value, false);
    assert.deepEqual(
      armadaCalls().map(call => [call.method, call.url]),
      [
        ["post", "/api/marketing-templates"],
        ["get", "/api/marketing-templates"]
      ]
    );
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

    try {
      await pageState.refreshTemplates();
      await pageState.openPreviewDrawer(pageState.rows.value[0]);

      assert.equal(
        pageState.templateForm.value.imageUrl,
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
