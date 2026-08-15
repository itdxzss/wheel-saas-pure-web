import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const displayModuleUrl = new URL(
  "./standard-execution-display.ts",
  import.meta.url
);

describe("standard pull task execution display", () => {
  it("maps the eight stages and manager setup anomaly", async () => {
    assert.ok(existsSync(fileURLToPath(displayModuleUrl)));
    const { standardExecutionStatus, standardStageLabel } = await import(
      displayModuleUrl.href
    );

    assert.equal(standardStageLabel(3), "管理员设置");
    assert.equal(standardStageLabel(4), "管理—拉手联系人");
    assert.equal(standardStageLabel(8), "执行收口");
    assert.equal(
      standardExecutionStatus({
        executionStatus: 3,
        stage: 3,
        waitResourceType: 1,
        reasonCode: "MANAGER_ADMIN_SETUP_FAILED"
      }),
      "ADMIN_SETUP_FAILED"
    );
    assert.equal(
      standardExecutionStatus({
        executionStatus: 3,
        stage: 2,
        waitResourceType: 4,
        reasonCode: "MANAGER_JOIN_PENDING_APPROVAL"
      }),
      "WAITING_APPROVAL"
    );
  });

  it("declares promoter and promote-manager labels", async () => {
    assert.ok(existsSync(fileURLToPath(displayModuleUrl)));
    const { actionTypeLabel, roleLabel } = await import(displayModuleUrl.href);

    assert.equal(roleLabel(4), "提权管理员");
    assert.equal(actionTypeLabel(4), "设置任务管理员");
  });

  it("declares group settings action labels", async () => {
    const { actionTypeLabel } = await import(displayModuleUrl.href);

    // 用词与 V119 迁移里 pull_task_account_action.action_type 的列注释保持一致。
    assert.equal(actionTypeLabel(5), "放开加人权限");
    assert.equal(actionTypeLabel(6), "关闭进群审核");
  });

  it("resolves puller and station accounts for each pull call", async () => {
    const { pullerAccountLabel, stationAccountLabel } = await import(
      displayModuleUrl.href
    );
    const roles = [
      {
        roleRowId: 1,
        accountId: 1066,
        accountPhone: "8613800001066",
        roleType: 2,
        roleSeq: 1,
        membershipStatus: 2,
        adminStatus: 0,
        availabilityStatus: 1,
        unavailableReasonCode: null,
        pullCallId: 201
      },
      {
        roleRowId: 2,
        accountId: 2048,
        accountPhone: "8613800002048",
        roleType: 3,
        roleSeq: 2,
        membershipStatus: 2,
        adminStatus: 0,
        availabilityStatus: 1,
        unavailableReasonCode: null,
        pullCallId: 201
      },
      {
        roleRowId: 3,
        accountId: 2047,
        accountPhone: "8613800002047",
        roleType: 3,
        roleSeq: 1,
        membershipStatus: 2,
        adminStatus: 0,
        availabilityStatus: 1,
        unavailableReasonCode: null,
        pullCallId: 201
      }
    ];

    assert.equal(pullerAccountLabel(roles, 1066), "8613800001066");
    assert.equal(
      stationAccountLabel(roles, 201),
      "8613800002047、8613800002048"
    );
    assert.equal(stationAccountLabel(roles, 202), "-");
  });
});
