<script setup lang="ts">
import { computed } from "vue";
import type { GroupBatchTaskDetail } from "@/api/group";
import { formatEpochMillis as formatEpoch } from "@/utils/time";

defineOptions({
  name: "GroupBatchTaskDialog"
});

const props = defineProps<{
  modelValue: boolean;
  detail: GroupBatchTaskDetail | null;
  error: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "close"): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

const title = computed(() =>
  props.detail?.taskType === "REFRESH_INFO"
    ? "批量获取最新群信息"
    : "批量刷新群链接"
);

const settled = computed(
  () => (props.detail?.successCount ?? 0) + (props.detail?.failedCount ?? 0)
);

const percentage = computed(() => {
  const total = props.detail?.totalCount ?? 0;
  if (total <= 0) return 0;
  return Math.min(100, Math.round((settled.value / total) * 100));
});

const statusLabel = computed(() => {
  const status = props.detail?.status;
  if (status === "COMPLETED") return "任务完成";
  if (status === "FAILED") return "任务失败";
  if (status === "RUNNING") return "运行中";
  return "待执行";
});

const progressStatus = computed(() => {
  if (props.detail?.status === "FAILED") return "exception";
  if (props.detail?.status === "COMPLETED") return "success";
  return undefined;
});

/** 运行中即展示已终结的明细，不等整个任务完成。 */
const settledItems = computed(
  () => props.detail?.items?.filter(item => item.status !== "PENDING") ?? []
);

function itemTagType(status: string): "success" | "danger" | "info" {
  if (status === "SUCCESS") return "success";
  return status === "FAILED" ? "danger" : "info";
}

function handleClose(): void {
  emit("close");
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="820px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      show-icon
      :closable="false"
      class="batch-task-alert"
    />

    <el-descriptions :column="3" border size="small">
      <el-descriptions-item label="任务ID">
        {{ detail?.taskId ?? "-" }}
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ detail?.createdAt == null ? "-" : formatEpoch(detail.createdAt) }}
      </el-descriptions-item>
      <el-descriptions-item label="任务进度">
        <el-tag
          :type="detail?.status === 'FAILED' ? 'danger' : 'info'"
          size="small"
        >
          {{ statusLabel }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="总数">
        {{ detail?.totalCount ?? 0 }}
      </el-descriptions-item>
      <el-descriptions-item label="成功">
        {{ detail?.successCount ?? 0 }}
      </el-descriptions-item>
      <el-descriptions-item label="失败">
        {{ detail?.failedCount ?? 0 }}
      </el-descriptions-item>
    </el-descriptions>

    <div class="batch-task-progress">
      <el-progress
        type="dashboard"
        :percentage="percentage"
        :status="progressStatus"
      />
    </div>

    <el-table :data="settledItems" border size="small" max-height="320">
      <el-table-column prop="groupLinkId" label="ID" width="90" />
      <el-table-column prop="account" label="账号" width="150">
        <template #default="{ row }">{{ row.account || "-" }}</template>
      </el-table-column>
      <el-table-column label="任务状态" width="110">
        <template #default="{ row }">
          <el-tag :type="itemTagType(row.status)" size="small">
            {{ row.status === "SUCCESS" ? "成功" : "失败" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="任务描述" min-width="220">
        <template #default="{ row }">{{ row.description || "-" }}</template>
      </el-table-column>
      <el-table-column label="操作时间" width="180">
        <template #default="{ row }">
          {{ row.operatedAt == null ? "-" : formatEpoch(row.operatedAt) }}
        </template>
      </el-table-column>
      <template #empty>
        <span>{{
          detail?.terminal ? "无结果明细" : "任务执行中，请稍候"
        }}</span>
      </template>
    </el-table>

    <template #footer>
      <el-button type="primary" @click="visible = false">确认</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.batch-task-alert {
  margin-bottom: 12px;
}

.batch-task-progress {
  display: flex;
  justify-content: center;
  padding: 12px 0;
}
</style>
