import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMock,
  resetArmadaMockQueue
} from "./__tests__/armada-test-double";
import {
  createGroupPullMarketingTask,
  deleteGroupPullMarketingTask,
  getGroupPullMarketingTask,
  listGroupPullMarketingGroups,
  listGroupPullMarketingTasks,
  pauseGroupPullMarketingTask,
  releaseGroupPullMarketingTask,
  resumeGroupPullMarketingTask,
  startGroupPullMarketingTask,
  type CreateGroupPullMarketingConfig
} from "./group-pull-marketing";

const config: CreateGroupPullMarketingConfig = {
  taskName: "七月拉群",
  builderGroupId: 11,
  successGroupId: 12,
  failureGroupId: null,
  marketingGroupId: 21,
  marketingAccountGroupLimit: 10,
  marketingTemplateId: 31,
  sendIntervalSeconds: 30,
  groupNamePrefix: "活动群",
  friendRetryLimit: 3,
  materialPerGroup: 3,
  materialEntryIntervalSeconds: 300,
  speakPermission: 1,
  builderExitEnabled: true,
  remark: "测试任务",
  taskEndAt: 1784822399000
};

describe("group pull marketing API", () => {
  it("creates task with one JSON config part and one material file", async () => {
    resetArmadaMock({ id: 1 });
    const file = new File(["8613900000000"], "materials.txt", {
      type: "text/plain"
    });

    await createGroupPullMarketingTask(config, file);

    const [call] = armadaCalls();
    assert.equal(call.method, "post");
    assert.equal(call.url, "/api/group-pull-marketing-tasks");
    const formData = (call.opts as { data: FormData }).data;
    const partNames: string[] = [];
    formData.forEach((_, name) => partNames.push(name));
    assert.deepEqual(partNames, ["config", "materialFile"]);
    const configPart = formData.get("config");
    assert.ok(configPart instanceof Blob);
    assert.equal(configPart.type, "application/json");
    assert.deepEqual(JSON.parse(await configPart.text()), config);
    const materialPart = formData.get("materialFile");
    assert.ok(materialPart instanceof File);
    assert.equal(materialPart.name, "materials.txt");
    assert.equal(await materialPart.text(), "8613900000000");
  });

  it("uses the task lifecycle and detail endpoints", async () => {
    resetArmadaMockQueue([{}, {}, {}, {}, {}, {}, {}, {}]);

    await listGroupPullMarketingTasks({
      page: 2,
      pageSize: 20,
      id: 8,
      keyword: "  七月  ",
      status: 2,
      blockReason: 0,
      resourceStatus: 2
    });
    await getGroupPullMarketingTask(8);
    await listGroupPullMarketingGroups(8, { page: 3, pageSize: 15 });
    await startGroupPullMarketingTask(8);
    await pauseGroupPullMarketingTask(8);
    await resumeGroupPullMarketingTask(8);
    await releaseGroupPullMarketingTask(8);
    await deleteGroupPullMarketingTask(8);

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/group-pull-marketing-tasks",
        opts: {
          params: {
            page: 2,
            pageSize: 20,
            id: 8,
            keyword: "七月",
            status: 2,
            blockReason: 0,
            resourceStatus: 2
          }
        }
      },
      {
        method: "get",
        url: "/api/group-pull-marketing-tasks/8",
        opts: undefined
      },
      {
        method: "get",
        url: "/api/group-pull-marketing-tasks/8/groups",
        opts: { params: { page: 3, pageSize: 15 } }
      },
      {
        method: "post",
        url: "/api/group-pull-marketing-tasks/8/start",
        opts: undefined
      },
      {
        method: "post",
        url: "/api/group-pull-marketing-tasks/8/pause",
        opts: undefined
      },
      {
        method: "post",
        url: "/api/group-pull-marketing-tasks/8/resume",
        opts: undefined
      },
      {
        method: "post",
        url: "/api/group-pull-marketing-tasks/8/release",
        opts: undefined
      },
      {
        method: "delete",
        url: "/api/group-pull-marketing-tasks/8",
        opts: undefined
      }
    ]);
  });
});
