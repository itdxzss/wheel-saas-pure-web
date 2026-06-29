<script setup lang="ts">
import { computed } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import WheelPagination from "@/components/WheelPagination/index.vue";
import type { JoinTaskRow } from "@/api/join-task";
import {
  failurePolicyLabel,
  formatEpoch,
  joinTaskDistributionLabel,
  joinTaskStatusLabel,
  joinTaskStatusTagType
} from "../constants";
import Delete from "~icons/ep/delete";
import Plus from "~icons/ep/plus";

defineOptions({
  name: "JoinTaskTable"
});

const props = defineProps<{
  columns: TableColumnList;
  loading: boolean;
  page: number;
  pageSize: number;
  rows: JoinTaskRow[];
  selectedCount: number;
  total: number;
}>();

const emit = defineEmits<{
  (event: "create"): void;
  (event: "delete-selected"): void;
  (event: "refresh"): void;
  (
    event: "row-action",
    row: JoinTaskRow,
    action: "detail" | "edit" | "copy"
  ): void;
  (event: "selection-change", rows: JoinTaskRow[]): void;
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

function asJoinTaskRow(row: unknown): JoinTaskRow {
  return row as JoinTaskRow;
}
</script>

<template>
  <PureTableBar title="进群任务" :columns="columns" @refresh="emit('refresh')">
    <template #buttons>
      <el-button
        type="primary"
        :icon="useRenderIcon(Plus)"
        @click="emit('create')"
      >
        创建进群任务
      </el-button>
      <el-button
        type="danger"
        plain
        :disabled="selectedCount === 0"
        :icon="useRenderIcon(Delete)"
        @click="emit('delete-selected')"
      >
        批量删除
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
              <strong>{{ row.name }}</strong>
              <small>{{ failurePolicyLabel(row.failurePolicy) }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[2].hide"
          label="账号分组"
          min-width="180"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.accountGroupNames || "-" }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[3].hide"
          label="分配方式"
          width="170"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ joinTaskDistributionLabel(row.distributionMode) }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[4].hide"
          label="进群统计"
          width="150"
        >
          <template #default="{ row }">
            <div class="count-cell">
              <span>{{ row.executed }} / {{ row.total }}</span>
              <small>成功 {{ row.success }} · 失败 {{ row.failed }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[5].hide"
          label="进群间隔"
          width="120"
        >
          <template #default="{ row }">
            {{ row.intervalLabel || "-" }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[6].hide"
          label="重试"
          width="110"
        >
          <template #default="{ row }">
            <el-tag size="small" effect="plain">
              {{ row.retryEnabled ? `${row.retryLimit} 次` : "关闭" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[7].hide"
          label="任务状态"
          width="120"
        >
          <template #default="{ row }">
            <el-tag
              size="small"
              :type="joinTaskStatusTagType(row.status)"
              effect="plain"
            >
              {{ joinTaskStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[8].hide"
          label="创建时间"
          width="180"
        >
          <template #default="{ row }">
            {{ formatEpoch(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="170">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              @click="emit('row-action', asJoinTaskRow(row), 'detail')"
            >
              明细
            </el-button>
            <el-button
              link
              type="primary"
              :disabled="row.status !== 'DRAFT' || row.executed > 0"
              @click="emit('row-action', asJoinTaskRow(row), 'edit')"
            >
              编辑
            </el-button>
            <el-button
              link
              type="success"
              @click="emit('row-action', asJoinTaskRow(row), 'copy')"
            >
              复制
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无符合条件的进群任务" />
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
.task-name-cell small,
.count-cell span,
.count-cell small {
  display: block;
}

.task-name-cell small,
.count-cell small {
  margin-top: 3px;
  color: var(--el-text-color-secondary);
}
</style>
