<script setup lang="ts">
import { computed } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import WheelPagination from "@/components/WheelPagination/index.vue";
import type { GroupCreationMarketingTaskRow } from "@/api/group-creation-marketing";
import {
  formatEpoch,
  taskStatusLabel,
  taskStatusTagType
} from "../constants";
import Download from "~icons/ep/download";
import Plus from "~icons/ep/plus";

defineOptions({
  name: "GroupCreationMarketingTaskTable"
});

const props = defineProps<{
  columns: TableColumnList;
  loading: boolean;
  page: number;
  pageSize: number;
  rows: GroupCreationMarketingTaskRow[];
  selectedCount: number;
  total: number;
  exporting: boolean;
}>();

const emit = defineEmits<{
  (event: "create"): void;
  (event: "detail", row: GroupCreationMarketingTaskRow): void;
  (event: "export-selected"): void;
  (event: "refresh"): void;
  (event: "selection-change", rows: GroupCreationMarketingTaskRow[]): void;
  (event: "stop", row: GroupCreationMarketingTaskRow): void;
  (event: "update:page", value: number): void;
  (event: "update:pageSize", value: number): void;
}>();

const currentPage = computed({
  get: () => props.page,
  set: value => emit("update:page", value)
});
const currentPageSize = computed({
  get: () => props.pageSize,
  set: value => emit("update:pageSize", value)
});

function asTaskRow(row: unknown): GroupCreationMarketingTaskRow {
  return row as GroupCreationMarketingTaskRow;
}

function canStop(row: GroupCreationMarketingTaskRow): boolean {
  return row.status === 1 || row.status === 2;
}
</script>

<template>
  <PureTableBar
    title="建群营销"
    :columns="columns"
    @refresh="emit('refresh')"
  >
    <template #buttons>
      <el-button
        type="primary"
        :icon="useRenderIcon(Plus)"
        @click="emit('create')"
      >
        新增建群营销
      </el-button>
      <el-button
        plain
        :disabled="selectedCount === 0"
        :loading="exporting"
        :icon="useRenderIcon(Download)"
        @click="emit('export-selected')"
      >
        导出
        <span v-if="selectedCount">({{ selectedCount }})</span>
      </el-button>
    </template>

    <template #default="{ dynamicColumns }">
      <el-table
        v-loading="loading"
        :data="rows"
        row-key="id"
        border
        @selection-change="emit('selection-change', $event)"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column
          v-if="!dynamicColumns[0].hide"
          prop="id"
          label="ID"
          width="90"
        />
        <el-table-column
          v-if="!dynamicColumns[1].hide"
          label="任务名称"
          min-width="220"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <div class="task-name-cell">
              <strong>{{ row.taskName }}</strong>
              <small>{{ row.groupNamePrefix || "默认群名前缀" }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[2].hide"
          prop="accountGroupName"
          label="账号分组"
          min-width="160"
          show-overflow-tooltip
        />
        <el-table-column
          v-if="!dynamicColumns[3].hide"
          prop="marketingTemplateName"
          label="营销模板"
          min-width="160"
          show-overflow-tooltip
        />
        <el-table-column
          v-if="!dynamicColumns[4].hide"
          label="匹配文件"
          width="140"
        >
          <template #default="{ row }">
            {{ row.matchedItemCount ?? 0 }}
            <span v-if="row.unmatchedFileCount" class="muted">
              / 未匹配 {{ row.unmatchedFileCount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[5].hide"
          label="执行结果"
          width="180"
        >
          <template #default="{ row }">
            <div class="result-cell">
              <el-tag size="small" type="success" effect="plain">
                成功 {{ row.successCount ?? 0 }}
              </el-tag>
              <el-tag size="small" type="danger" effect="plain">
                失败 {{ row.failedCount ?? 0 }}
              </el-tag>
              <el-tag size="small" type="warning" effect="plain">
                放弃 {{ row.abandonedCount ?? 0 }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[6].hide"
          label="任务状态"
          width="120"
        >
          <template #default="{ row }">
            <el-tag
              size="small"
              :type="taskStatusTagType(row.status)"
              effect="plain"
            >
              {{ taskStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[7].hide"
          label="创建时间"
          width="180"
        >
          <template #default="{ row }">
            {{ formatEpoch(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="150">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              @click="emit('detail', asTaskRow(row))"
            >
              明细
            </el-button>
            <el-button
              link
              type="warning"
              :disabled="!canStop(asTaskRow(row))"
              @click="emit('stop', asTaskRow(row))"
            >
              停止
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无建群营销任务" />
        </template>
      </el-table>

      <WheelPagination
        v-model:current-page="currentPage"
        v-model:page-size="currentPageSize"
        :total="total"
        @change="emit('refresh')"
      />
    </template>
  </PureTableBar>
</template>

<style scoped>
.task-name-cell strong,
.task-name-cell small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-name-cell small,
.muted {
  color: var(--el-text-color-secondary);
}

.result-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
