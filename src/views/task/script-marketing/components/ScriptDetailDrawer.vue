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
import ScriptTaskOverview from "./ScriptTaskOverview.vue";
import ScriptSendConfiguration from "./ScriptSendConfiguration.vue";
import ScriptSendRecords from "./ScriptSendRecords.vue";
const visible = defineModel<boolean>({ required: true });
const props = defineProps<{ detail?: ScriptDetail; loading: boolean }>();
const emit = defineEmits<{
  refresh: [];
  qualification: [report: ScriptQualification];
}>();
const operatingGroup = ref<number>();
const activeTab = ref("records");
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
      .map(
        ([role, account]) =>
          `${role}：${props.detail?.accountPhones?.[account] || "手机号不可用"}`
      )
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
function groupProgress(group: ScriptGroup): number {
  const count = props.detail?.steps.length ?? 0;
  return count
    ? Math.min(100, Math.max(0, Math.floor((group.nextStep / count) * 100)))
    : 0;
}
function groupStatus(group: ScriptGroup): string {
  const detail = props.detail;
  if (!detail) return "—";
  if (detail.steps.length && group.nextStep >= detail.steps.length)
    return "已处理完毕";
  if (detail.task.status === 4) return "已关闭";
  if (group.paused || detail.task.status === 2) return "已暂停";
  if (detail.task.status === 0) return "待启动";
  return `待处理第 ${group.nextStep + 1} 项`;
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
watch(visible, open => {
  if (open) activeTab.value = "records";
});
</script>

<template>
  <el-drawer
    v-model="visible"
    title="剧本任务详情"
    size="min(1040px, 100vw)"
    class="script-detail-drawer"
  >
    <div v-loading="loading" class="detail-content">
      <template v-if="detail">
        <ScriptTaskOverview
          :detail="detail"
          :loading="loading"
          @refresh="emit('refresh')"
        />
        <el-alert
          v-if="detail.task.pauseReason"
          :title="detail.task.pauseReason"
          type="warning"
          show-icon
          :closable="false"
        />
        <el-alert
          v-if="detail.task.status === 2"
          :closable="false"
          type="info"
          show-icon
          :title="
            detail.task.inFlightCount
              ? `正在暂停：仍有 ${detail.task.inFlightCount} 项在途消息，继续跟踪原结果`
              : '已暂停，可通过现有渠道人工处理，交回时点击继续'
          "
        />
        <section class="detail-panel" aria-label="群执行情况">
          <div class="section-heading">
            <h3>
              群执行情况 <span>{{ detail.groups.length }} 个群</span>
            </h3>
            <span class="section-hint"
              >展开查看{{
                detail.task.accountGroupId ? "角色绑定与" : ""
              }}群详情</span
            >
          </div>
          <el-table
            :data="detail.groups"
            row-key="id"
            class="group-table"
            empty-text="暂无目标群"
          >
            <el-table-column type="expand" width="44">
              <template #default="{ row }">
                <dl class="group-details">
                  <div>
                    <dt>群 ID</dt>
                    <dd>{{ row.groupJid }}</dd>
                  </div>
                  <div v-if="detail.task.accountGroupId">
                    <dt>角色绑定</dt>
                    <dd>{{ bindings(row) }}</dd>
                  </div>
                  <div>
                    <dt>异常 / 暂停</dt>
                    <dd>{{ row.pauseReason || "—" }}</dd>
                  </div>
                </dl>
              </template>
            </el-table-column>
            <el-table-column label="目标群" min-width="210">
              <template #default="{ row }"
                ><span class="group-name">{{
                  row.groupName || row.groupJid
                }}</span></template
              >
            </el-table-column>
            <el-table-column label="处理进度" min-width="190">
              <template #default="{ row }">
                <div class="group-progress-label">
                  <span
                    >已处理 {{ row.nextStep }} /
                    {{ detail.steps.length }} 项</span
                  ><span>{{ groupProgress(row) }}%</span>
                </div>
                <el-progress
                  :percentage="groupProgress(row)"
                  :show-text="false"
                  :stroke-width="5"
                />
              </template>
            </el-table-column>
            <el-table-column label="当前状态" min-width="170">
              <template #default="{ row }">
                <el-tag
                  :type="
                    row.paused || detail.task.status === 2 ? 'warning' : 'info'
                  "
                  effect="plain"
                  size="small"
                  >{{ groupStatus(row) }}</el-tag
                >
                <el-tooltip
                  v-if="row.pauseReason"
                  :content="row.pauseReason"
                  placement="top"
                  :show-after="250"
                >
                  <div class="group-reason">{{ row.pauseReason }}</div>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column
              v-if="detail.task.accountGroupId && detail.task.status === 1"
              label="操作"
              width="105"
              fixed="right"
            >
              <template #default="{ row }">
                <el-button
                  v-perms="'tenant:script_marketing:operate'"
                  link
                  type="primary"
                  :loading="operatingGroup === row.id"
                  :disabled="
                    operatingGroup !== undefined ||
                    (row.nextStep >= detail.steps.length && !row.paused)
                  "
                  @click="actGroup(row, row.paused ? 'resume' : 'pause')"
                  >{{ row.paused ? "继续该群" : "暂停该群" }}</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </section>
        <section class="detail-panel supporting-detail" aria-label="发送明细">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="发送记录" name="records">
              <ScriptSendRecords
                v-model:page="page"
                :rows="rows"
                :groups="detail.groups"
                :loading="loadingRecords"
                :total="total"
                @reload="loadRecords"
              />
            </el-tab-pane>
            <el-tab-pane
              :label="`发送配置（${detail.steps.length}）`"
              name="configuration"
              lazy
            >
              <ScriptSendConfiguration :key="detail.task.id" :detail="detail" />
            </el-tab-pane>
          </el-tabs>
        </section>
      </template>
      <el-empty
        v-else-if="!loading"
        description="暂未读取到任务详情，请关闭后重试"
      />
    </div>
  </el-drawer>
</template>

<style scoped>
:global(.script-detail-drawer .el-drawer__header) {
  padding: 20px 24px;
  margin-bottom: 0;
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

:global(.script-detail-drawer .el-drawer__body) {
  padding: 24px;
  background: var(--el-fill-color-light);
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 240px;
}

.detail-panel {
  min-width: 0;
  padding: 20px 24px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

.section-heading {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

h3 span {
  margin-left: 8px;
  font-size: 13px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.section-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.group-table {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

.group-table :deep(.el-table__cell) {
  padding: 15px 0;
}

.group-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
  overflow-wrap: anywhere;
}

.group-progress-label {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.group-reason {
  margin-top: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: var(--el-color-warning-dark-2);
  white-space: nowrap;
}

.group-details {
  display: grid;
  gap: 12px;
  padding: 20px 24px;
  margin: 0;
  background: var(--el-fill-color-lighter);
}

.group-details > div {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr);
  gap: 12px;
}

dt {
  color: var(--el-text-color-secondary);
}

dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.supporting-detail {
  padding-top: 8px;
}

.supporting-detail :deep(.el-tabs__item) {
  height: 52px;
  font-size: 14px;
}

.supporting-detail :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
}

.supporting-detail :deep(.el-tabs__header) {
  margin-bottom: 18px;
}

@media (width <= 600px) {
  :global(.script-detail-drawer .el-drawer__body) {
    padding: 12px;
  }

  .detail-content {
    gap: 12px;
  }

  .detail-panel {
    padding: 16px;
  }
}
</style>
