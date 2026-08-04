import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const componentUrl = new URL(
  "./PullTaskManagerSupplementDrawer.vue",
  import.meta.url
);
const detailUrl = new URL("./PullTaskDetailDrawer.vue", import.meta.url);
const indexUrl = new URL("../index.vue", import.meta.url);
const actionsUrl = new URL(
  "./PullTaskExecutionResourceActions.vue",
  import.meta.url
);
const resourceFlowUrl = new URL(
  "./PullTaskResourceSupplementFlows.vue",
  import.meta.url
);
const managerFlowUrl = new URL(
  "./PullTaskManagerSupplementFlow.vue",
  import.meta.url
);

describe("normal-link manager supplement selection", () => {
  it("shows counts, all confirmed selections and a real candidate list", () => {
    assert.equal(existsSync(fileURLToPath(componentUrl)), true);
    const source = readFileSync(fileURLToPath(componentUrl), "utf8");

    for (const label of [
      "当前管理员",
      "要求管理员",
      "缺少管理员",
      "管理员账号分组",
      "管理员账号",
      "进入群组方式",
      "执行设置账号",
      "候选管理员账号"
    ]) {
      assert.match(source, new RegExp(label));
    }
    assert.match(source, /踩链接进群/);
    assert.match(source, /当前管理员邀请进群/);
    assert.match(source, /managerInviteAvailable/);
    assert.match(source, /candidates/);
  });

  it("mounts one permission-guarded execution-row entry and one drawer", () => {
    const detailSource = readFileSync(fileURLToPath(detailUrl), "utf8");
    const indexSource = readFileSync(fileURLToPath(indexUrl), "utf8");
    const actionsSource = readFileSync(fileURLToPath(actionsUrl), "utf8");
    const resourceFlowSource = readFileSync(
      fileURLToPath(resourceFlowUrl),
      "utf8"
    );
    const managerFlowSource = readFileSync(
      fileURLToPath(managerFlowUrl),
      "utf8"
    );

    assert.match(detailSource, /open-manager-supplement/);
    assert.match(actionsSource, /tenant:pull_task:operate/);
    assert.match(indexSource, /<PullTaskResourceSupplementFlows/);
    assert.match(resourceFlowSource, /<PullTaskManagerSupplementFlow/);
    assert.match(managerFlowSource, /<PullTaskManagerSupplementDrawer/);
    assert.match(managerFlowSource, /usePullTaskManagerSupplement/);
    assert.equal(
      (managerFlowSource.match(/<PullTaskManagerSupplementDrawer/g) ?? [])
        .length,
      1
    );
  });
});
