import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import {
  listBuyerTemplates,
  updateBuyerTemplateRemark,
  updateBuyerTemplateVisibility
} from "./buyer-template";

describe("buyer template API", () => {
  it("uses the template list endpoint", async () => {
    resetArmadaMock([]);

    assert.deepEqual(await listBuyerTemplates(), []);
    assert.deepEqual(armadaCalls(), [
      { method: "get", url: "/api/buyer/templates", opts: undefined }
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
