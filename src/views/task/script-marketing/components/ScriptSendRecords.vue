<script setup lang="ts">
import dayjs from "dayjs";
import type { ScriptGroup, ScriptRecord } from "@/api/script-marketing";
import { recordLabels } from "../form";

defineProps<{
  rows: ScriptRecord[];
  groups: ScriptGroup[];
  loading: boolean;
  total: number;
}>();
const page = defineModel<number>("page", { required: true });
const emit = defineEmits<{ reload: [] }>();
function time(value: number | null) {
  return value ? dayjs(value).format("YYYY/MM/DD HH:mm:ss") : "—";
}
function resultType(status: ScriptRecord["status"]) {
  if (status === 2) return "success";
  if (status === 3) return "danger";
  if (status === 4) return "warning";
  return "info";
}
</script>

<template>
  <div class="send-records">
    <p class="section-hint">
      失败后继续后续项；未知结果不自动重发，迟到结果会补记。
    </p>
    <el-table
      v-loading="loading"
      :data="rows"
      row-key="id"
      class="records-table"
    >
      <template #empty
        ><el-empty description="暂无发送记录" :image-size="64"
      /></template>
      <el-table-column type="expand" width="44">
        <template #default="{ row }">
          <dl class="record-details">
            <div>
              <dt>结果时间</dt>
              <dd>{{ time(row.finishedAt) }}</dd>
            </div>
            <div>
              <dt>原因</dt>
              <dd>{{ row.reason || "—" }}</dd>
            </div>
            <div>
              <dt>消息 ID</dt>
              <dd>{{ row.messageId || "—" }}</dd>
            </div>
            <div>
              <dt>原命令 ID</dt>
              <dd>{{ row.commandId || "—" }}</dd>
            </div>
          </dl>
        </template>
      </el-table-column>
      <el-table-column label="目标群 / 发送项" min-width="210">
        <template #default="{ row }">
          <div class="record-group">
            {{
              groups.find(group => group.id === row.groupId)?.groupName ||
              groups.find(group => group.id === row.groupId)?.groupJid ||
              `群执行 #${row.groupId}`
            }}
          </div>
          <div class="record-step">
            第 {{ row.stepIndex + 1 }} 项 · 账号 #{{ row.accountId }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="提交时间" width="180">
        <template #default="{ row }">{{ time(row.submittedAt) }}</template>
      </el-table-column>
      <el-table-column label="结果" width="125">
        <template #default="{ row }"
          ><el-tag :type="resultType(row.status)" effect="light">{{
            recordLabels[row.status]
          }}</el-tag></template
        >
      </el-table-column>
      <el-table-column
        prop="reason"
        label="原因"
        min-width="170"
        show-overflow-tooltip
      >
        <template #default="{ row }">{{ row.reason || "—" }}</template>
      </el-table-column>
    </el-table>
    <el-pagination
      v-if="total > 0"
      v-model:current-page="page"
      class="records-pagination"
      :page-size="20"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="emit('reload')"
    />
  </div>
</template>

<style scoped>
.section-hint {
  margin: 0 0 16px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.records-table {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

.records-table :deep(.el-table__cell) {
  padding: 13px 0;
}

.record-group {
  color: var(--el-text-color-primary);
  overflow-wrap: anywhere;
}

.record-step {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.record-details {
  display: grid;
  gap: 12px;
  padding: 20px 24px;
  margin: 0;
  background: var(--el-fill-color-lighter);
}

.record-details > div {
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

.records-pagination {
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
