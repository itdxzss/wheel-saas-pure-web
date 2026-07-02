import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMock
} from "@/api/__tests__/armada-test-double";
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
