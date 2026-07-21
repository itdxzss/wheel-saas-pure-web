import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import {
  listBuyerTemplateOptions,
  queryBuyerTemplates,
  updateBuyerTemplateRemark,
  updateBuyerTemplateVisibility
} from "./buyer-template";

describe("buyer template API", () => {
  it("queries and maps the promotion template page", async () => {
    resetArmadaMock({
      list: [
        {
          id: 37,
          templateCode: "base_sex",
          templateName: "约会二代",
          previewUri: "/preview/base_sex.png",
          subaccountVisible: true,
          supportedParams: [{ code: "themeColor", label: "主题色" }],
          remark: null,
          createdAt: 1_721_465_309_000,
          updatedAt: 1_721_465_409_000
        }
      ],
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1
    });

    const result = await queryBuyerTemplates({ page: 1, page_size: 20 });
    assert.equal(result.list[0].id, 37);
    assert.equal(result.list[0].name, "约会二代");
    assert.deepEqual(result.list[0].supportedParams, ["主题色"]);
    assert.deepEqual(await listBuyerTemplateOptions(), [
      { id: 37, name: "约会二代" }
    ]);
    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/promotion-templates/query",
        opts: { params: { page: 1, pageSize: 20 } }
      },
      {
        method: "get",
        url: "/api/promotion-templates/query",
        opts: { params: { page: 1, pageSize: 200 } }
      }
    ]);
  });

  it("patches visibility and remark with the required payloads", async () => {
    resetArmadaMock(undefined);

    await updateBuyerTemplateVisibility(7, false);
    await updateBuyerTemplateRemark(7, "已确认");

    assert.deepEqual(armadaCalls(), [
      {
        method: "patch",
        url: "/api/buyer/templates/7/subaccount-visibility",
        opts: { data: { subaccountVisible: false } }
      },
      {
        method: "patch",
        url: "/api/buyer/templates/7/remark",
        opts: { data: { remark: "已确认" } }
      }
    ]);
  });
});
