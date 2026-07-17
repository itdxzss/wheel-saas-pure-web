import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMock
} from "@/api/__tests__/armada-test-double";
import { saveChangedGroupProfile } from "./useGroupProfileSaving";

describe("group profile field saving", () => {
  it("submits only changed fields and keeps a result per field", async () => {
    resetArmadaMock(undefined);

    const results = await saveChangedGroupProfile(
      42,
      { groupName: "新群名", remark: "未变化" },
      { groupName: "旧群名", remark: "未变化" }
    );

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/group-links/42/subject",
        opts: { data: { subject: "新群名" } }
      }
    ]);
    assert.equal(results.length, 1);
    assert.equal(results[0].field, "groupName");
    assert.equal(results[0].settled.status, "fulfilled");
  });

  it("does not call the backend when neither field changed", async () => {
    resetArmadaMock(undefined);

    const results = await saveChangedGroupProfile(
      42,
      { groupName: "群名", remark: "备注" },
      { groupName: "群名", remark: "备注" }
    );

    assert.deepEqual(results, []);
    assert.deepEqual(armadaCalls(), []);
  });
});
