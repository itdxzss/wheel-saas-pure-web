<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  saveScriptTask,
  scriptAccountOptions,
  scriptGroupOptions,
  scriptAccountGroupOptions,
  checkScriptDraft,
  type ScriptQualification,
  type ScriptAccountGroupOption,
  type ScriptAccountOption,
  type ScriptDetail,
  type ScriptSave
} from "@/api/script-marketing";
import type { GroupListRow } from "@/api/group";
import { apiErrorMessage } from "@/utils/api-error";
import {
  copyStep,
  newStep,
  toScriptSave,
  validateScript,
  type EditableStep
} from "../form";
import ScriptStepsEditor from "./ScriptStepsEditor.vue";
import ScriptQualificationPanel from "./ScriptQualificationPanel.vue";
import ScriptDefinitionPicker from "./ScriptDefinitionPicker.vue";

const visible = defineModel<boolean>({ required: true });
const props = defineProps<{ task?: ScriptDetail }>();
const emit = defineEmits<{ saved: [] }>();
const router = useRouter();
const form = reactive<ScriptSave & { steps: EditableStep[] }>({
  taskName: "",
  accountGroupId: null,
  intervalSeconds: 10,
  startAt: null,
  endAt: null,
  groupLinkIds: [],
  steps: []
});
const accounts = ref<ScriptAccountOption[]>([]);
const groupOptions = ref<Pick<GroupListRow, "id" | "groupName">[]>([]);
const saving = ref(false);
const accountsLoading = ref(false);
const groupsLoading = ref(false);
const scheduled = ref(false);
const accountGroups = ref<ScriptAccountGroupOption[]>([]);
const report = ref<ScriptQualification>();
const checking = ref(false);
const groupPage = ref(1);
const groupTotal = ref(0);
const groupKeyword = ref("");
let accountRequest = 0;
let groupRequest = 0;
async function loadAccounts(keyword = "") {
  const request = ++accountRequest;
  accountsLoading.value = true;
  try {
    const result = await scriptAccountOptions(keyword);
    if (request !== accountRequest) return;
    const map = new Map(
      accounts.value
        .filter(row => form.steps.some(step => step.accountId === row.id))
        .map(row => [row.id, row])
    );
    result.list.forEach(row => map.set(row.id, row));
    accounts.value = [...map.values()];
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "账号读取失败"));
  } finally {
    if (request === accountRequest) accountsLoading.value = false;
  }
}
async function loadGroups(keyword = "", append = false) {
  const request = ++groupRequest;
  if (!form.accountGroupId) {
    groupsLoading.value = false;
    return;
  }
  const requestedPage = append ? groupPage.value + 1 : 1;
  groupKeyword.value = keyword;
  groupsLoading.value = true;
  try {
    const result = await scriptGroupOptions(
      form.accountGroupId,
      keyword,
      requestedPage
    );
    if (request !== groupRequest) return;
    groupPage.value = requestedPage;
    const map = new Map(
      groupOptions.value
        .filter(row => append || form.groupLinkIds.includes(row.id))
        .map(row => [row.id, row])
    );
    result.list.forEach(row => map.set(row.id, row));
    groupOptions.value = [...map.values()];
    groupTotal.value = result.total;
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "群组读取失败"));
  } finally {
    if (request === groupRequest) groupsLoading.value = false;
  }
}
async function loadAccountGroups() {
  try {
    accountGroups.value = await scriptAccountGroupOptions();
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "账号分组读取失败"));
  }
}
async function check() {
  const error = validateScript(form);
  if (error) {
    ElMessage.warning(error);
    return;
  }
  checking.value = true;
  const snapshot = JSON.stringify(toScriptSave(form));
  try {
    const result = await checkScriptDraft(toScriptSave(form));
    if (snapshot === JSON.stringify(toScriptSave(form))) report.value = result;
  } catch (error) {
    report.value = undefined;
    ElMessage.error(apiErrorMessage(error, "资格检查失败，请重新检查"));
  } finally {
    checking.value = false;
  }
}
async function save(goToJoin = false) {
  form.startAt = scheduled.value ? form.startAt : null;
  if (scheduled.value && !form.startAt) {
    ElMessage.warning("请选择开始时间");
    return;
  }
  const error = validateScript(form);
  if (error) {
    ElMessage.warning(error);
    return;
  }
  saving.value = true;
  try {
    await saveScriptTask(toScriptSave(form), props.task?.task.id);
    ElMessage.success("草稿已保存，可在任务列表启动");
    visible.value = false;
    emit("saved");
    if (goToJoin) await router.push("/task/join");
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "保存失败"));
  } finally {
    saving.value = false;
  }
}
watch(visible, open => {
  if (!open) return;
  const detail = props.task;
  Object.assign(
    form,
    detail
      ? {
          taskName: detail.task.taskName,
          accountGroupId: detail.task.accountGroupId,
          intervalSeconds: detail.task.intervalSeconds,
          startAt: detail.task.startAt,
          endAt: detail.task.endAt,
          groupLinkIds: detail.groups.map(g => g.groupLinkId),
          steps: detail.steps.map(copyStep)
        }
      : {
          taskName: "",
          accountGroupId: null,
          intervalSeconds: 10,
          startAt: null,
          endAt: null,
          groupLinkIds: [],
          steps: [newStep("ADMIN"), newStep()]
        }
  );
  scheduled.value = !!detail && detail.task.startAt > Date.now();
  report.value = undefined;
  accounts.value = form.steps
    .filter(s => s.accountId)
    .map(s => ({ id: s.accountId!, wsPhone: `账号 #${s.accountId}` }));
  groupOptions.value =
    detail?.groups.map(g => ({ id: g.groupLinkId, groupName: g.groupName })) ||
    [];
  void loadAccounts();
  void loadAccountGroups();
  void loadGroups();
});
watch(
  () => form.accountGroupId,
  () => {
    report.value = undefined;
    void loadGroups();
  }
);
watch(
  () => [form.steps, form.groupLinkIds],
  () => {
    report.value = undefined;
  },
  { deep: true }
);
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="task ? '编辑剧本任务' : '新建剧本任务'"
    size="820px"
    :close-on-click-modal="false"
  >
    <el-form :model="form" label-width="100px" :disabled="saving">
      <el-form-item label="任务名称" required
        ><el-input v-model="form.taskName" maxlength="100"
      /></el-form-item>
      <ScriptDefinitionPicker
        v-if="visible"
        @select="
          definition => {
            form.steps = definition.steps.map(copyStep);
            if (!form.taskName) form.taskName = definition.name;
          }
        "
      />
      <el-form-item label="推手分组" required>
        <el-select
          v-model="form.accountGroupId"
          filterable
          placeholder="选择推手账号分组"
          style="width: 100%"
        >
          <el-option
            v-for="group in accountGroups"
            :key="group.id"
            :value="group.id"
            :label="group.name"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="目标群" required>
        <el-select
          v-model="form.groupLinkIds"
          multiple
          filterable
          remote
          :remote-method="keyword => loadGroups(keyword)"
          :disabled="!form.accountGroupId"
          :loading="groupsLoading"
          :multiple-limit="100"
          placeholder="搜索本分组账号所在的群，所选群都执行完整剧本"
          style="width: 100%"
        >
          <el-option
            v-for="group in groupOptions"
            :key="group.id"
            :value="group.id"
            :label="group.groupName || `群 #${group.id}`"
          />
          <template #footer
            ><el-button
              v-if="groupPage * 100 < groupTotal"
              :loading="groupsLoading"
              text
              @click="loadGroups(groupKeyword, true)"
              >加载更多群</el-button
            ></template
          >
        </el-select>
      </el-form-item>
      <el-form-item label="默认间隔" required
        ><el-input-number
          v-model="form.intervalSeconds"
          :min="1"
          :max="86400"
        /><span class="field-note"
          >秒，新增发送项的默认值，每项可单独调整</span
        ></el-form-item
      >
      <el-form-item label="开始方式"
        ><el-switch
          v-model="scheduled"
          active-text="定时开始"
          inactive-text="启动后立即发送"
      /></el-form-item>
      <el-form-item v-if="scheduled" label="开始时间" required
        ><el-date-picker
          v-model="form.startAt"
          type="datetime"
          value-format="x"
      /></el-form-item>
      <el-form-item label="截止时间"
        ><el-date-picker
          v-model="form.endAt"
          type="datetime"
          value-format="x"
          placeholder="选填，到期关闭"
      /></el-form-item>
      <ScriptStepsEditor
        v-model="form.steps"
        :accounts="accounts"
        :loading="accountsLoading"
        :default-wait="form.intervalSeconds"
        @search-accounts="loadAccounts"
      />
      <el-button :loading="checking" @click="check">检查所选群资格</el-button>
      <ScriptQualificationPanel
        v-if="report"
        :report="report"
        :loading="checking"
        join-label="保存草稿并前往进群任务"
        @check="check"
        @join="save(true)"
      />
      <el-alert
        title="所选群全部通过资格检查后才能启动。进群由独立进群任务完成；暂停恢复保留角色和进度，下一条未提交消息不延续原等待。"
        type="info"
        :closable="false"
      />
    </el-form>
    <template #footer
      ><el-button :disabled="saving" @click="visible = false">取消</el-button
      ><el-button type="primary" :loading="saving" @click="save()"
        >保存草稿</el-button
      ></template
    >
  </el-drawer>
</template>

<style scoped>
.field-note {
  margin-left: 12px;
  color: var(--el-text-color-secondary);
}

.add-step {
  width: 100%;
  margin: 16px 0;
}
</style>
