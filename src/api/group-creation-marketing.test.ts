import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import { httpCalls, resetHttpMock } from "./__tests__/http-test-double";
import {
  createGroupCreationMarketingTask,
  exportGroupCreationMarketingTasks,
  listGroupCreationMarketingAccountCandidates
} from "./group-creation-marketing";

describe("group creation marketing API", () => {
  it("posts ordered material files", async () => {
    resetArmadaMock({ id: 1 });

    await createGroupCreationMarketingTask({
      taskName: "建群营销",
      accountGroupId: 8,
      accountGroupName: "A组",
      marketingTemplateId: 18,
      marketingTemplateName: "模板",
      sendIntervalSeconds: 45,
      groupNamePrefix: "活动群",
      remark: null,
      materials: [
        { fileName: "a.txt", content: "8613900000000" },
        { fileName: "b.txt", content: "8613911111111" }
      ]
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/group-creation-marketing-tasks",
        opts: {
          data: {
            taskName: "建群营销",
            accountGroupId: 8,
            accountGroupName: "A组",
            marketingTemplateId: 18,
            marketingTemplateName: "模板",
            sendIntervalSeconds: 45,
            groupNamePrefix: "活动群",
            remark: null,
            materials: [
              { fileName: "a.txt", content: "8613900000000" },
              { fileName: "b.txt", content: "8613911111111" }
            ]
          }
        }
      }
    ]);
  });

  it("loads account candidates from group creation endpoint", async () => {
    resetArmadaMock([{ accountId: 7 }]);

    await listGroupCreationMarketingAccountCandidates(8);

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/group-creation-marketing-tasks/account-candidates",
        opts: { params: { accountGroupId: 8 } }
      }
    ]);
  });

  it("stops a group creation marketing task", async () => {
    resetArmadaMock(1);

    const { stopGroupCreationMarketingTask } = await import(
      "./group-creation-marketing"
    );
    await stopGroupCreationMarketingTask(7);

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/group-creation-marketing-tasks/7/stop",
        opts: undefined
      }
    ]);
  });

  it("exports selected tasks as an xlsx blob", async () => {
    const blob = new Blob(["xlsx"], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    resetHttpMock(blob, {
      "content-disposition":
        "attachment; filename*=UTF-8''group-creation-marketing.xlsx"
    });

    const result = await exportGroupCreationMarketingTasks([9, 8]);

    assert.equal(result.filename, "group-creation-marketing.xlsx");
    assert.equal(result.blob, blob);
    assert.deepEqual(httpCalls(), [
      {
        method: "post",
        url: "/api/group-creation-marketing-tasks/export",
        opts: { data: { ids: [9, 8] }, responseType: "blob" },
        configKeys: ["beforeResponseCallback"]
      }
    ]);
  });
});
