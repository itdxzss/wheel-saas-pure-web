<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  saveScriptTask,
  scriptAccountOptions,
  scriptGroupOptions,
  type ScriptAccountOption,
  type ScriptDetail,
  type ScriptSave
} from "@/api/script-marketing";
import type { GroupListRow } from "@/api/group";
import { apiErrorMessage } from "@/utils/api-error";
import {
  copyStep,
  mayRemove,
  newStep,
  toScriptSave,
  validateScript,
  type EditableStep
} from "../form";
import ScriptMessageEditor from "./ScriptMessageEditor.vue";

const visible = defineModel<boolean>({ required: true });
const props = defineProps<{ task?: ScriptDetail }>();
const emit = defineEmits<{ saved: [] }>();
const form = reactive<ScriptSave & { steps: EditableStep[] }>({
  taskName: "",
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
const activeStep = ref("");
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
async function loadGroups(keyword = "") {
  const request = ++groupRequest;
  groupsLoading.value = true;
  try {
    const result = await scriptGroupOptions(keyword);
    if (request !== groupRequest) return;
    const map = new Map(
      groupOptions.value
        .filter(row => form.groupLinkIds.includes(row.id))
        .map(row => [row.id, row])
    );
    result.list.forEach(row => map.set(row.id, row));
    groupOptions.value = [...map.values()];
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "群组读取失败"));
  } finally {
    if (request === groupRequest) groupsLoading.value = false;
  }
}
function move(index: number, offset: number) {
  const target = index + offset;
  [form.steps[index], form.steps[target]] = [
    form.steps[target],
    form.steps[index]
  ];
}
async function save() {
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
          intervalSeconds: detail.task.intervalSeconds,
          startAt: detail.task.startAt,
          endAt: detail.task.endAt,
          groupLinkIds: detail.groups.map(g => g.groupLinkId),
          steps: detail.steps.map(copyStep)
        }
      : {
          taskName: "",
          intervalSeconds: 10,
          startAt: null,
          endAt: null,
          groupLinkIds: [],
          steps: [newStep("ADMIN"), newStep()]
        }
  );
  scheduled.value = !!detail && detail.task.startAt > Date.now();
  activeStep.value = form.steps[0].key;
  accounts.value = form.steps
    .filter(s => s.accountId)
    .map(s => ({ id: s.accountId!, wsPhone: `账号 #${s.accountId}` }));
  groupOptions.value =
    detail?.groups.map(g => ({ id: g.groupLinkId, groupName: g.groupName })) ||
    [];
  void loadAccounts();
  void loadGroups();
});
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
      <el-form-item label="目标群" required>
        <el-select
          v-model="form.groupLinkIds"
          multiple
          filterable
          remote
          :remote-method="loadGroups"
          :loading="groupsLoading"
          :multiple-limit="100"
          placeholder="搜索群名称，选择固定目标群"
          style="width: 100%"
        >
          <el-option
            v-for="group in groupOptions"
            :key="group.id"
            :value="group.id"
            :label="group.groupName || `群 #${group.id}`"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="统一间隔" required
        ><el-input-number
          v-model="form.intervalSeconds"
          :min="1"
          :max="86400"
        /><span class="field-note">秒，每项结束后等待</span></el-form-item
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
      <el-divider content-position="left">按以下顺序逐项发送</el-divider>
      <el-collapse v-model="activeStep" accordion>
        <el-collapse-item
          v-for="(step, index) in form.steps"
          :key="step.key"
          :name="step.key"
        >
          <template #title
            ><strong
              >第 {{ index + 1 }} 项 ·
              {{ step.role === "ADMIN" ? "管理员" : "推手" }}</strong
            ></template
          >
          <el-form-item label="顺序操作">
            <el-button :disabled="index === 0" @click="move(index, -1)"
              >上移</el-button
            >
            <el-button
              :disabled="index === form.steps.length - 1"
              @click="move(index, 1)"
              >下移</el-button
            >
            <el-button
              :disabled="form.steps.length >= 100"
              @click="form.steps.splice(index + 1, 0, copyStep(step))"
              >复制此项</el-button
            >
            <el-button
              type="danger"
              link
              :disabled="!mayRemove(form.steps, index)"
              @click="form.steps.splice(index, 1)"
              >删除</el-button
            >
          </el-form-item>
          <el-form-item label="发送账号" required>
            <el-select
              v-model="step.accountId"
              filterable
              remote
              :remote-method="loadAccounts"
              :loading="accountsLoading"
              placeholder="搜索号码并选择账号"
              style="width: 100%"
            >
              <el-option
                v-for="account in accounts"
                :key="account.id"
                :value="account.id"
                :label="`${account.wsPhone} · #${account.id}`"
              />
            </el-select>
          </el-form-item>
          <ScriptMessageEditor v-model="step.message" />
        </el-collapse-item>
      </el-collapse>
      <el-button
        class="add-step"
        :disabled="form.steps.length >= 100"
        @click="
          form.steps.push(newStep());
          activeStep = form.steps[form.steps.length - 1].key;
        "
        >添加推手 + 消息配置</el-button
      >
      <el-alert
        title="单项失败继续后面的发送；启动后配置固定。暂停/人工接管后，继续时保留原进度。"
        type="info"
        :closable="false"
      />
    </el-form>
    <template #footer
      ><el-button :disabled="saving" @click="visible = false">取消</el-button
      ><el-button type="primary" :loading="saving" @click="save"
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
