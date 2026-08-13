import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  commonGroupNamePreview,
  createCommonGroupForm,
  toCommonGroupCreateRequest,
  validateCommonGroupForm
  // @ts-ignore Node's native TypeScript test runner requires the explicit extension.
} from "./common-group/common-group-form.ts";

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
const accountGroupApiSource = source("../../../api/account-group.ts");

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
    assert.doesNotMatch(formSource, /请选择次管理员分组/);
    assert.match(formSource, /请选择成员分组/);
    assert.match(formSource, /建群数量必须为 1 至 1000 的整数/);
    assert.match(formSource, /计划群成员快照不能超过 10000 条/);
    assert.match(formSource, /成员数量必须为 1 至 1024 的整数/);
    assert.doesNotMatch(formSource, /请输入群名称/);
    assert.match(formSource, /生成后的群名称最多 128 个字符/);
    assert.match(configurationSource, /群名称（可选）/);
    assert.match(
      configurationSource,
      /9 位大写随机字母 \+ 群组 JID 本地部分最后 5/
    );
    assert.match(configurationSource, /:disabled="!form\.groupName\.trim\(\)"/);
    assert.match(configurationSource, /群名留空时不参与自动命名/);
    assert.match(formSource, /自动生成（第 \$\{index \+ 1\} 个群）/);
    assert.doesNotMatch(
      composableSource,
      /!value\.groupNameTemplate\.trim\(\)/
    );
    assert.match(
      formSource,
      /startNo: form\.groupName\.trim\(\) \? form\.startIndex : 1/
    );
    assert.match(formSource, /开始编号必须为大于等于 1 的整数/);
    assert.match(
      composableSource,
      /validateCommonGroupForm\(form, accountGroups\.value\)/
    );
    assert.match(composableSource, /confirmVisible\.value = true/);
    assert.match(composableSource, /请检查并完善表单配置/);
  });

  it("accepts a blank group name and normalizes its unused start number", () => {
    const form = createCommonGroupForm();
    form.managerGroupId = 101;
    form.secondaryManagerGroupId = 103;
    form.secondaryManagerCount = 1;
    form.memberGroupId = 102;
    form.groupName = "   ";
    form.startIndex = 0;

    assert.deepEqual(validateCommonGroupForm(form), {});
    assert.deepEqual(commonGroupNamePreview(form), ["自动生成（第 1 个群）"]);
    assert.deepEqual(
      {
        groupNameTemplate: toCommonGroupCreateRequest(form).groupNameTemplate,
        startNo: toCommonGroupCreateRequest(form).startNo
      },
      { groupNameTemplate: "", startNo: 1 }
    );
  });

  it("keeps explicit group-name numbering behavior unchanged", () => {
    const form = createCommonGroupForm();
    form.managerGroupId = 101;
    form.secondaryManagerGroupId = 103;
    form.secondaryManagerCount = 1;
    form.memberGroupId = 102;
    form.groupName = "项目群-{no}";
    form.groupCount = 2;
    form.startIndex = 7;

    assert.deepEqual(validateCommonGroupForm(form), {});
    assert.deepEqual(commonGroupNamePreview(form), ["项目群-7", "项目群-8"]);
    assert.equal(toCommonGroupCreateRequest(form).startNo, 7);
  });

  it("validates and submits the secondary-admin group configuration", () => {
    const form = createCommonGroupForm();
    form.managerGroupId = 101;
    form.secondaryManagerGroupId = 103;
    form.secondaryManagerCount = 2;
    form.memberGroupId = 102;

    assert.deepEqual(
      validateCommonGroupForm(form, [
        { id: 103, onlineAccounts: 1, executableOnlineAccounts: 1 }
      ]),
      {
        secondaryManagerCount:
          "次管理员分组当前在线账号仅 1 个，请减少次管理员入群数量"
      }
    );

    assert.deepEqual(
      validateCommonGroupForm(form, [
        { id: 103, onlineAccounts: 10, executableOnlineAccounts: 2 }
      ]),
      {}
    );
    assert.deepEqual(
      {
        secondaryAdminAccountGroupId:
          toCommonGroupCreateRequest(form).secondaryAdminAccountGroupId,
        secondaryAdminCount:
          toCommonGroupCreateRequest(form).secondaryAdminCount
      },
      { secondaryAdminAccountGroupId: 103, secondaryAdminCount: 2 }
    );
    assert.match(accountMemberSource, /次管理员分组/);
    assert.match(accountMemberSource, /次管理员入群数量/);
    assert.match(accountMemberSource, /在线/);
    assert.match(
      accountGroupApiSource,
      /executableOnlineAccounts = row\.executableOnlineCount \?\? 0/
    );
    assert.match(flowSource, /次管理员配置/);
    assert.match(composableSource, /PENDING_SUBMISSION_STORAGE_VERSION = 2/);
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

  it("stops stalled task polling and leaves an actionable error in the drawer", () => {
    assert.match(composableSource, /MAX_UNCHANGED_POLL_ATTEMPTS\s*=\s*120/);
    assert.match(composableSource, /MAX_CONSECUTIVE_POLL_ERRORS\s*=\s*3/);
    assert.match(composableSource, /taskProgressSignature/);
    assert.match(composableSource, /unchangedPollAttempts/);
    assert.match(composableSource, /consecutivePollErrors/);
    assert.match(composableSource, /连续 5 分钟无进展/);
    assert.match(composableSource, /连续 3 次读取失败/);
    assert.match(flowSource, /:polling-error="pollingError"/);
    assert.match(taskDrawerSource, /v-if="pollingError"/);
    assert.match(taskDrawerSource, /type="error"/);
  });

  it("reports the final outcome of the exact item submitted for retry", () => {
    assert.match(
      composableSource,
      /const retryingItemBaselines = new Map<number, number>\(\)/
    );
    assert.match(
      composableSource,
      /retryingItemBaselines\.set\(item\.id, item\.updatedAt\)[\s\S]*retryCommonGroupTaskItem\(taskId, item\.id\)/
    );
    assert.match(
      composableSource,
      /function notifyRetryResult[\s\S]*retryingItemBaselines\.get\(row\.id\)[\s\S]*row\.updatedAt <= baseline/
    );
    assert.match(
      composableSource,
      /row\.status === "FAILED"[\s\S]*重试失败：\$\{itemMessage\(row\)\}/
    );
    assert.match(
      composableSource,
      /function applyTaskDetail[\s\S]*detail\.items\.forEach\(notifyRetryResult\)/
    );
    assert.match(composableSource, /updatedAt: row\.updatedAt/);
    assert.match(
      composableSource,
      /task\.value\?\.status !== "PROCESSING" &&[\s\S]*retryingItemBaselines\.size === 0/
    );
    assert.match(
      composableSource,
      /function prepareTaskRetry[\s\S]*activeTaskId !== taskId[\s\S]*activateTask\(taskId\)[\s\S]*taskRequestSequence \+= 1[\s\S]*return taskGeneration/
    );
    assert.match(
      composableSource,
      /const generation = prepareTaskRetry\(taskId\)/
    );
    assert.match(
      composableSource,
      /已提交重试，最新进度读取失败，将继续自动刷新[\s\S]*schedulePolling\(taskId, generation\)/
    );
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
