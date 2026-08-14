import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
// @ts-expect-error Node 24 测试运行器直接加载同目录 TypeScript 源文件。
import { buildCommonGroupTaskLogs } from "./common-group-task-logs.ts";

function source(relativePath: string): string {
  return readFileSync(
    fileURLToPath(new URL(relativePath, import.meta.url)),
    "utf8"
  );
}

const indexSource = source("./index.vue");
const flowSource = source(
  "./components/common-group/CommonGroupCreateFlow.vue"
);
const accountMemberSource = source(
  "./components/common-group/CommonGroupAccountMemberSections.vue"
);
const configurationSource = source(
  "./components/common-group/CommonGroupConfigurationSections.vue"
);
const formSource = source("./common-group/common-group-form.ts");
const composableSource = source("./composables/useCommonGroupCreate.ts");
const taskDrawerSource = source(
  "./components/common-group/CommonGroupTaskDrawer.vue"
);
const apiSource = source("../../../api/common-group-task.ts");

describe("common group creation flow", () => {
  it("places the common-group entry after the existing pull-task entry", () => {
    assert.match(
      indexSource,
      /新建拉群任务[\s\S]*commonGroupCreateFlow\?\.open\(\)[\s\S]*新建普群/
    );
    assert.match(indexSource, /CommonGroupCreateFlow/);
    assert.match(
      indexSource,
      /v-perms="\['tenant:normal_group:create', 'tenant:normal_group:view'\]"[\s\S]*新建普群/
    );
  });

  it("keeps the unconfirmed member and speed options disabled", () => {
    assert.match(accountMemberSource, /value="CUSTOM" disabled>自定义号码/);
    assert.match(configurationSource, /value="FAST" disabled>快速/);
    assert.doesNotMatch(flowSource, /待确认/);
  });

  it("validates the required groups and numeric limits before confirmation", () => {
    assert.match(formSource, /请选择管理员分组/);
    assert.match(formSource, /请选择成员分组/);
    assert.match(formSource, /建群数量必须为 1 至 1000 的整数/);
    assert.match(formSource, /计划群成员快照不能超过 10000 条/);
    assert.match(formSource, /成员数量必须为 1 至 1024 的整数/);
    assert.match(formSource, /请输入群名称/);
    assert.match(formSource, /生成后的群名称最多 128 个字符/);
    assert.match(formSource, /开始编号必须为大于等于 1 的整数/);
    assert.match(composableSource, /validateCommonGroupForm\(form\)/);
    assert.match(composableSource, /confirmVisible\.value = true/);
  });

  it("loads current account groups and protects dirty-form closing", () => {
    assert.match(composableSource, /listAccountGroups/);
    assert.match(composableSource, /listGroupFolders/);
    assert.match(composableSource, /放弃未提交的修改/);
    assert.match(flowSource, /确认创建普群任务/);
    assert.match(flowSource, /@return-to-form="returnToForm"/);
    assert.match(flowSource, /@refresh="refreshCurrentTask"/);
  });

  it("uses real asynchronous task APIs and never simulates execution", () => {
    assert.match(apiSource, /\/api\/normal-group-creation-tasks/);
    assert.match(apiSource, /"Idempotency-Key"/);
    assert.match(composableSource, /pendingSubmission/);
    assert.match(composableSource, /ACTIVE_TASK_STORAGE_KEY/);
    assert.match(composableSource, /PENDING_SUBMISSION_STORAGE_KEY/);
    assert.match(composableSource, /PENDING_SUBMISSION_STORAGE_VERSION/);
    assert.match(composableSource, /storedSubmissionIdentity/);
    assert.match(composableSource, /storeSubmissionIdentity/);
    assert.match(composableSource, /isCommonGroupTaskCreateRequest/);
    assert.match(composableSource, /hasExactKeys/);
    assert.match(
      composableSource,
      /removeItem\(PENDING_SUBMISSION_STORAGE_KEY\)/
    );
    assert.match(composableSource, /payload: parsed\.payload/);
    assert.match(
      composableSource,
      /storedSubmissionIdentity\(\)[\s\S]*recoverStoredSubmission/
    );
    assert.match(
      composableSource,
      /recoverStoredSubmission[\s\S]*createCommonGroupTask\([\s\S]*submission\.payload,[\s\S]*submission\.idempotencyKey/
    );
    assert.match(
      composableSource,
      /enterTaskResult[\s\S]*storeTaskId\(summary\.id\);[\s\S]*if \(disposed\) return;/
    );
    assert.match(composableSource, /sessionStorage/);
    assert.match(composableSource, /taskGeneration/);
    assert.match(composableSource, /taskRequestSequence/);
    assert.match(composableSource, /requestSequence !== taskRequestSequence/);
    assert.match(composableSource, /disposed/);
    assert.match(composableSource, /onBeforeUnmount\(\(\) =>/);
    assert.match(composableSource, /activeTaskId !== taskId/);
    assert.match(composableSource, /retryable: row\.status === "FAILED"/);
    assert.match(
      composableSource,
      /stopPolling\(\);[\s\S]*activateTask\(taskId\)[\s\S]*retryCommonGroupTaskItem/
    );
    assert.match(composableSource, /getCommonGroupTask/);
    assert.match(composableSource, /POLL_INTERVAL_MS/);
    assert.doesNotMatch(composableSource, /startMockExecution|模拟执行/);
    assert.match(taskDrawerSource, /v-perms="\['tenant:normal_group:retry'\]"/);
    assert.doesNotMatch(taskDrawerSource, /v-auth=/);
  });

  it("shows the creator phone, operation time and business stage logs", () => {
    assert.match(apiSource, /creatorWsPhone: string/);
    assert.match(composableSource, /creatorPhone: row\.creatorWsPhone/);
    assert.match(
      composableSource,
      /operationTime: formatOperationTime\(row\.updatedAt\)/
    );
    assert.match(composableSource, /buildCommonGroupTaskLogs\(detail\)/);
    assert.match(taskDrawerSource, /prop="creatorPhone" label="创群号"/);
    assert.match(taskDrawerSource, /prop="operationTime" label="操作时间"/);
    assert.match(taskDrawerSource, /任务日志/);
    assert.match(taskDrawerSource, /v-for="log in task\.logs"/);
  });

  it("does not invent the settings stage for a partial result stopped at group creation", () => {
    const logs = buildCommonGroupTaskLogs({
      task: {
        id: 8,
        status: "PARTIAL",
        totalCount: 1,
        successCount: 0,
        failedCount: 1,
        createdAt: 1,
        updatedAt: 2
      },
      items: [
        {
          id: 81,
          itemNo: 1,
          groupSubject: "测试群",
          creatorAccountId: 11,
          creatorWsPhone: "919000000001",
          creatorProtocolBackend: "WEB",
          groupJid: "120363000000000@g.us",
          groupLinkId: null,
          status: "CREATED_PARTIAL",
          currentStep: "CREATING_GROUP",
          settingsStatus: "PENDING",
          creatorLeaveStatus: "PENDING",
          lastErrorCode: "SECONDARY_ADMIN_PROMOTION_FAILED",
          lastErrorMessage: "部分管理员未设置成功",
          updatedAt: 2
        }
      ]
    });

    assert.match(logs.join("\n"), /后续群配置阶段未执行完成/);
    assert.doesNotMatch(logs.join("\n"), /进入设置管理员与群配置阶段/);
  });

  it("does not invent group creation when the task ended during contact preparation", () => {
    const logs = buildCommonGroupTaskLogs({
      task: {
        id: 9,
        status: "FAILED",
        totalCount: 1,
        successCount: 0,
        failedCount: 1,
        createdAt: 1,
        updatedAt: 2
      },
      items: [
        {
          id: 91,
          itemNo: 1,
          groupSubject: "测试群",
          creatorAccountId: 11,
          creatorWsPhone: "919000000001",
          creatorProtocolBackend: "WEB",
          groupJid: null,
          groupLinkId: null,
          status: "FAILED",
          currentStep: "PREPARING_CONTACTS",
          settingsStatus: "PENDING",
          creatorLeaveStatus: "PENDING",
          lastErrorCode: "CONTACT_RATE_LIMITED",
          lastErrorMessage: "联系人操作触发限流",
          updatedAt: 2
        }
      ]
    });

    assert.match(logs.join("\n"), /任务未进入新建普群阶段/);
    assert.ok(!logs.includes("互为好友阶段已完成，进入新建普群阶段。"));
  });

  it("maps the five confirmed settings and keeps invite-link settings out", () => {
    assert.match(formSource, /sendMessagesAllowed/);
    assert.match(formSource, /editGroupSettingsAllowed/);
    assert.match(formSource, /addMembersAllowed/);
    assert.match(formSource, /joinApprovalEnabled/);
    assert.match(formSource, /ephemeralDurationSeconds/);
    assert.doesNotMatch(formSource, /linkPermission/);
  });
});
