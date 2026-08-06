import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

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
  it("keeps common-group creation out of the pull-task page", () => {
    assert.match(indexSource, /@click="openStandardCreate"/);
    assert.doesNotMatch(indexSource, /CommonGroupCreateFlow/);
    assert.doesNotMatch(indexSource, /commonGroupCreateFlow/);
    assert.doesNotMatch(indexSource, /新建普群/);
    assert.doesNotMatch(indexSource, /tenant:normal_group:create/);
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

  it("maps the five confirmed settings and keeps invite-link settings out", () => {
    assert.match(formSource, /sendMessagesAllowed/);
    assert.match(formSource, /editGroupSettingsAllowed/);
    assert.match(formSource, /addMembersAllowed/);
    assert.match(formSource, /joinApprovalEnabled/);
    assert.match(formSource, /ephemeralDurationSeconds/);
    assert.doesNotMatch(formSource, /linkPermission/);
  });
});
