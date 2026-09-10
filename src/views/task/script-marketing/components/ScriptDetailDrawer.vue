<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  listScriptRecords,
  actOnScriptGroup,
  qualificationFromError,
  type ScriptQualification,
  type ScriptGroup,
  type ScriptDetail,
  type ScriptRecord
} from "@/api/script-marketing";
import { apiErrorMessage } from "@/utils/api-error";
import { taskLabels, recordLabels } from "../form";
const visible = defineModel<boolean>({ required: true });
const props = defineProps<{ detail?: ScriptDetail; loading: boolean }>();
const emit = defineEmits<{
  refresh: [];
  qualification: [report: ScriptQualification];
}>();
const operatingGroup = ref<number>();
async function actGroup(group: ScriptGroup, action: "pause" | "resume") {
  if (!props.detail) return;
  operatingGroup.value = group.id;
  try {
    await actOnScriptGroup(props.detail.task.id, group.id, action);
    emit("refresh");
  } catch (error) {
    const report = qualificationFromError(error);
    if (report) emit("qualification", report);
    ElMessage.error(apiErrorMessage(error, "群操作失败"));
  } finally {
    operatingGroup.value = undefined;
  }
}
function bindings(group: ScriptGroup): string {
  if (!group.bindingsJson) return "尚未分配";
  try {
    const value: Record<string, number> = JSON.parse(group.bindingsJson);
    return Object.entries(value)
      .map(([role, account]) => `${role}：账号 #${account}`)
      .join("；");
  } catch {
    return "角色绑定读取失败，请刷新";
  }
}
const rows = ref<ScriptRecord[]>([]);
const page = ref(1);
const total = ref(0);
const loadingRecords = ref(false);
let requestId = 0;
function time(value: number | null | undefined) {
  return value ? new Date(value).toLocaleString() : "—";
}
async function loadRecords() {
  const request = ++requestId;
  rows.value = [];
  total.value = 0;
  if (!visible.value || !props.detail) {
    loadingRecords.value = false;
    return;
  }
  loadingRecords.value = true;
  try {
    const result = await listScriptRecords(props.detail.task.id, page.value);
    if (request !== requestId) return;
    rows.value = result.list;
    total.value = result.total;
  } catch (error) {
    if (request === requestId)
      ElMessage.error(apiErrorMessage(error, "发送记录读取失败"));
  } finally {
    if (request === requestId) loadingRecords.value = false;
  }
}
watch(
  () => [visible.value, props.detail] as const,
  () => {
    page.value = 1;
    void loadRecords();
  }
);
</script>

<template>
  <el-drawer v-model="visible" title="剧本任务详情" size="900px">
    <div v-loading="loading">
      <template v-if="detail">
        <el-space wrap
          ><h3>{{ detail.task.taskName }}</h3>
          <el-tag>{{ taskLabels[detail.task.status] }}</el-tag
          ><el-button @click="emit('refresh')">刷新</el-button></el-space
        >
        <el-alert
          v-if="detail.task.pauseReason"
          :title="detail.task.pauseReason"
          type="warning"
          :closable="false"
          class="spaced"
        />
        <el-alert
          v-if="detail.task.status === 2"
          class="spaced"
          :closable="false"
          type="info"
          :title="
            detail.task.inFlightCount
              ? `正在暂停：仍有 ${detail.task.inFlightCount} 项在途消息，继续跟踪原结果`
              : '已暂停，可通过现有渠道人工处理，交回时点击继续'
          "
        />
        <el-descriptions :column="3" border class="spaced">
          <el-descriptions-item label="成功">{{
            detail.task.successCount
          }}</el-descriptions-item>
          <el-descriptions-item label="失败">{{
            detail.task.failedCount
          }}</el-descriptions-item>
          <el-descriptions-item label="未知">{{
            detail.task.unknownCount
          }}</el-descriptions-item>
          <el-descriptions-item label="发送间隔">{{
            detail.task.accountGroupId
              ? "按各项间隔，从前条提交计时"
              : `${detail.task.intervalSeconds} 秒，旧版结果后计时`
          }}</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{
            time(detail.task.startAt)
          }}</el-descriptions-item>
          <el-descriptions-item label="截止时间">{{
            time(detail.task.endAt)
          }}</el-descriptions-item>
        </el-descriptions>
        <el-divider content-position="left">每群进度</el-divider>
        <el-table :data="detail.groups" row-key="id" border>
          <el-table-column label="目标群" min-width="200"
            ><template #default="{ row }">{{
              row.groupName || row.groupJid
            }}</template></el-table-column
          >
          <el-table-column label="已处理" width="120"
            ><template #default="{ row }"
              >{{ row.nextStep }} / {{ detail.steps.length }}</template
            ></el-table-column
          >
          <el-table-column label="进度" min-width="160"
            ><template #default="{ row }">{{
              row.nextStep >= detail.steps.length
                ? "全部处理完毕"
                : `第 ${row.nextStep + 1} 项`
            }}</template></el-table-column
          >
          <el-table-column
            v-if="detail.task.accountGroupId"
            label="角色绑定"
            min-width="220"
          >
            <template #default="{ row }">{{ bindings(row) }}</template>
          </el-table-column>
          <el-table-column label="异常 / 暂停" min-width="190"
            ><template #default="{ row }">{{
              row.pauseReason || "—"
            }}</template></el-table-column
          >
          <el-table-column
            v-if="detail.task.accountGroupId && detail.task.status === 1"
            label="操作"
            width="100"
          >
            <template #default="{ row }"
              ><el-button
                v-auth="'tenant:script_marketing:operate'"
                link
                type="primary"
                :disabled="
                  operatingGroup !== undefined ||
                  (row.nextStep >= detail.steps.length && !row.paused)
                "
                @click="actGroup(row, row.paused ? 'resume' : 'pause')"
                >{{ row.paused ? "继续该群" : "暂停该群" }}</el-button
              ></template
            >
          </el-table-column>
        </el-table>
        <el-divider content-position="left">固定发送配置</el-divider>
        <el-collapse>
          <el-collapse-item
            v-for="(step, index) in detail.steps"
            :key="`${detail.task.id}:${index}`"
            :title="`第 ${index + 1} 项 · ${step.roleKey || (step.role === 'ADMIN' ? '管理员' : '推手')}${step.accountId ? ' · 账号 #' + step.accountId : ' · 按群分配'}`"
          >
            <div class="message-text">
              {{ step.message.content }}<br />{{ step.message.bodyText }}
            </div>
            <p v-if="detail.task.accountGroupId">
              {{
                index === 0
                  ? "首条不等待"
                  : `等待 ${step.waitMinSeconds}–${step.waitMaxSeconds} 秒后提交`
              }}
            </p>
            <p v-if="step.message.imageFileId">
              图片素材 #{{ step.message.imageFileId }}
            </p>
            <p>{{ step.message.promotionLink }}</p>
            <el-tag
              v-for="button in step.message.buttons"
              :key="button.type + button.text + button.param"
              >{{ button.text }}</el-tag
            >
          </el-collapse-item>
        </el-collapse>
        <el-divider content-position="left">逐项发送记录</el-divider>
        <el-table
          v-loading="loadingRecords"
          :data="rows"
          row-key="id"
          border
          empty-text="暂无发送记录"
        >
          <el-table-column label="目标群" min-width="140"
            ><template #default="{ row }">{{
              detail.groups.find(group => group.id === row.groupId)
                ?.groupName || `群执行 #${row.groupId}`
            }}</template></el-table-column
          >
          <el-table-column label="顺序" width="65"
            ><template #default="{ row }">{{
              row.stepIndex + 1
            }}</template></el-table-column
          >
          <el-table-column prop="accountId" label="账号 ID" width="90" />
          <el-table-column label="提交时间" min-width="160"
            ><template #default="{ row }">{{
              time(row.submittedAt)
            }}</template></el-table-column
          >
          <el-table-column label="结果时间" min-width="160"
            ><template #default="{ row }">{{
              time(row.finishedAt)
            }}</template></el-table-column
          >
          <el-table-column label="结果" width="115"
            ><template #default="{ row }">{{
              recordLabels[row.status]
            }}</template></el-table-column
          >
          <el-table-column
            prop="reason"
            label="原因"
            min-width="180"
            show-overflow-tooltip
          />
          <el-table-column
            prop="messageId"
            label="消息 ID"
            min-width="130"
            show-overflow-tooltip
          />
          <el-table-column
            prop="commandId"
            label="原命令 ID"
            min-width="150"
            show-overflow-tooltip
          />
        </el-table>
        <el-pagination
          v-model:current-page="page"
          class="spaced"
          :page-size="20"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="loadRecords"
        />
        <el-text type="info"
          >失败会继续后项；未知结果不自动重发，迟到结果会补记。执行完成表示所有项已处理。</el-text
        >
      </template>
    </div>
  </el-drawer>
</template>

<style scoped>
.spaced {
  margin: 16px 0;
}

.message-text {
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
</style>
