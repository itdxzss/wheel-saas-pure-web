<script setup lang="ts">
import { computed } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import WheelPagination from "@/components/WheelPagination/index.vue";
import type { MarketingTaskRow } from "@/api/marketing-task";
import { formatEpoch, taskStatusLabel, taskStatusTagType } from "../constants";
import Delete from "~icons/ep/delete";
import Plus from "~icons/ep/plus";

defineOptions({
  name: "GroupMarketingTaskTable"
});

const props = defineProps<{
  columns: TableColumnList;
  loading: boolean;
  page: number;
  pageSize: number;
  rows: MarketingTaskRow[];
  selectedCount: number;
  total: number;
}>();

const emit = defineEmits<{
  (event: "create"): void;
  (event: "delete-selected"): void;
  (event: "refresh"): void;
  (event: "row-action", row: MarketingTaskRow, action: string): void;
  (event: "selection-change", rows: MarketingTaskRow[]): void;
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

function asMarketingTaskRow(row: unknown): MarketingTaskRow {
  return row as MarketingTaskRow;
}
</script>

<template>
  <PureTableBar
    title="群组营销任务"
    :columns="columns"
    @refresh="emit('refresh')"
  >
    <template #buttons>
      <el-button
        type="primary"
        :icon="useRenderIcon(Plus)"
        @click="emit('create')"
      >
        新增群组营销任务
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
              <strong>{{ row.taskName }}</strong>
              <small>
                {{ row.accountGroupName }} · {{ row.marketingTemplateName }}
              </small>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[2].hide"
          label="营销账号在线数量"
          width="150"
        >
          <template #default="{ row }">
            {{ row.selectedAccountCount ?? 0 }} 个在线
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[3].hide"
          label="营销账号封禁/禁言"
          width="150"
        >
          <template #default="{ row }">
            <el-tag size="small" type="warning" effect="plain">
              失败 {{ row.failedMessageCount ?? 0 }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[4].hide"
          label="营销群组数量"
          width="130"
        >
          <template #default="{ row }">
            {{ row.targetGroupCount ?? 0 }} 个群
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[5].hide"
          label="发送条数"
          width="110"
        >
          <template #default="{ row }">
            {{ row.sentMessageCount ?? 0 }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[6].hide"
          label="发送状态"
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
          label="最后发送时间"
          width="180"
        >
          <template #default="{ row }">
            {{ formatEpoch(row.lastSentAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="250">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              @click="emit('row-action', asMarketingTaskRow(row), 'detail')"
            >
              明细
            </el-button>
            <el-button
              link
              type="warning"
              :disabled="row.status !== 2"
              @click="emit('row-action', asMarketingTaskRow(row), 'stop')"
            >
              停止
            </el-button>
            <el-button
              link
              type="success"
              :disabled="row.status === 2"
              @click="emit('row-action', asMarketingTaskRow(row), 'start')"
            >
              启动
            </el-button>
            <el-button
              link
              type="primary"
              @click="emit('row-action', asMarketingTaskRow(row), 'material')"
            >
              修改营销素材
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无符合条件的群组营销任务" />
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
}

.task-name-cell small {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
}
</style>
