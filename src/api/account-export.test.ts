import assert from "node:assert/strict";
import { it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import { completeAccountExport, createAccountExport } from "./account-export";

it("账号导出只发送显式 ids，创建和交付回执是独立接口", async () => {
  resetArmadaMock({});
  await createAccountExport("request-1", [9, 4]);
  await completeAccountExport("request-1", "digest");
  assert.deepEqual(armadaCalls(), [
    {
      method: "post",
      url: "/api/accounts/exports",
      opts: { data: { requestId: "request-1", ids: [9, 4] } }
    },
    {
      method: "post",
      url: "/api/accounts/exports/request-1/complete",
      opts: { data: { sha256: "digest" } }
    }
  ]);
});
