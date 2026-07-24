<script setup lang="ts">
import { computed } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import WheelPagination from "@/components/WheelPagination/index.vue";
import type { GroupPullMarketingTaskRow } from "@/api/group-pull-marketing";
import {
  blockReasonLabel,
  blockReasonTagType,
  formatEpoch,
  groupPullTaskActions,
  resourceStatusLabel,
  resourceStatusTagType,
  taskStatusLabel,
  taskStatusTagType,
  type GroupPullTaskAction
} from "../constants";
import Plus from "~icons/ep/plus";

defineOptions({
  name: "GroupPullMarketingTaskTable"
});

const props = defineProps<{
  columns: TableColumnList;
  loading: boolean;
  page: number;
  pageSize: number;
  rows: GroupPullMarketingTaskRow[];
  total: number;
}>();

const emit = defineEmits<{
  (
    event: "action",
    action: GroupPullTaskAction,
    row: GroupPullMarketingTaskRow
  ): void;
  (event: "create"): void;
  (event: "refresh"): void;
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

function asTaskRow(row: unknown): GroupPullMarketingTaskRow {
  return row as GroupPullMarketingTaskRow;
}

function taskActions(row: GroupPullMarketingTaskRow): GroupPullTaskAction[] {
  return groupPullTaskActions(row);
}

function actionLabel(action: GroupPullTaskAction): string {
  return {
    start: "启动",
    pause: "暂停",
    resume: "恢复",
    release: "释放账号",
    detail: "明细",
    delete: "删除"
  }[action];
}

function actionType(action: GroupPullTaskAction) {
  if (action === "delete") return "danger";
  if (action === "release" || action === "pause") return "warning";
  return "primary";
}
</script>

<template>
  <PureTableBar title="拉群营销" :columns="columns" @refresh="emit('refresh')">
    <template #buttons>
      <el-button
        type="primary"
        :icon="useRenderIcon(Plus)"
        @click="emit('create')"
      >
        新增拉群营销
      </el-button>
    </template>

    <template #default="{ dynamicColumns }">
      <el-table v-loading="loading" :data="rows" row-key="id" border>
        <el-table-column
          v-if="!dynamicColumns[0].hide"
          prop="id"
          label="任务ID"
          width="90"
        />
        <el-table-column
          v-if="!dynamicColumns[1].hide"
          prop="taskName"
          label="任务名称"
          min-width="180"
          show-overflow-tooltip
        />
        <el-table-column
          v-if="!dynamicColumns[2].hide"
          label="任务状态"
          min-width="170"
        >
          <template #default="{ row }">
            <div class="status-cell">
              <el-tag
                size="small"
                effect="plain"
                :type="taskStatusTagType(row.status)"
              >
                {{ taskStatusLabel(row.status) }}
              </el-tag>
              <el-tag
                size="small"
                effect="plain"
                :type="blockReasonTagType(row.blockReason)"
              >
                {{ blockReasonLabel(row.blockReason) }}
              </el-tag>
              <el-tag
                size="small"
                effect="plain"
                :type="resourceStatusTagType(row.resourceStatus)"
              >
                {{ resourceStatusLabel(row.resourceStatus) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[3].hide"
          label="数据"
          min-width="130"
        >
          <template #default="{ row }">
            {{ row.totalDataCount ?? 0 }}/{{ row.completedDataCount ?? 0 }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[4].hide"
          prop="successGroupCount"
          label="建群数量"
          width="110"
        />
        <el-table-column
          v-if="!dynamicColumns[5].hide"
          prop="failedGroupCount"
          label="失败数量"
          width="110"
        />
        <el-table-column
          v-if="!dynamicColumns[6].hide"
          label="营销号"
          min-width="130"
        >
          <template #default="{ row }">
            {{
              row.marketingAccountTotalCount == null
                ? "-"
                : row.marketingAccountTotalCount
            }}/{{ row.usedMarketingAccountCount ?? 0 }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[7].hide"
          label="创建时间"
          min-width="175"
        >
          <template #default="{ row }">
            {{ formatEpoch(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[8].hide"
          label="结束时间"
          min-width="175"
        >
          <template #default="{ row }">
            {{ formatEpoch(row.taskEndAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" min-width="210">
          <template #default="{ row }">
            <el-button
              v-for="action in taskActions(row)"
              :key="action"
              link
              :type="actionType(action)"
              @click="emit('action', action, asTaskRow(row))"
            >
              {{ actionLabel(action) }}
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无拉群营销任务" />
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
.status-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}
</style>
