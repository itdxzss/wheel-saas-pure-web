<script setup lang="ts">
import { computed } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import WheelPagination from "@/components/WheelPagination/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import type { AccountImportTask } from "@/api/account-import";
import type { AccountImportExportKind } from "../types";
import {
  accountImportAbnormalLabel,
  accountImportLoginFailCount
} from "../account-import-display";
import { exportOptions } from "../constants";
import RefreshRight from "~icons/ep/refresh-right";
import Upload from "~icons/ep/upload";

defineOptions({
  name: "AccountImportTable"
});

const props = defineProps<{
  columns: TableColumnList;
  exportingTaskId: number | null;
  loading: boolean;
  page: number;
  pageSize: number;
  rows: AccountImportTask[];
  total: number;
}>();

const emit = defineEmits<{
  (event: "create"): void;
  (event: "detail", row: AccountImportTask): void;
  (
    event: "export",
    row: AccountImportTask,
    kind: AccountImportExportKind
  ): void;
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

function formatDate(value?: string | null): string {
  if (!value) return "-";
  return value.replace("T", " ").slice(0, 19);
}

function toTask(row: unknown): AccountImportTask {
  return row as AccountImportTask;
}

function progressLabel(row: AccountImportTask): string {
  if (row.progress) return row.progress;
  return `${row.imported ?? 0} / ${row.total ?? 0}`;
}

function statusTagType(status?: string): "success" | "warning" | "info" {
  if (status === "已完成") return "success";
  if (status === "导入中" || status === "进行中") return "warning";
  return "info";
}

function exportRow(row: AccountImportTask, command: string): void {
  emit("export", row, command as AccountImportExportKind);
}
</script>

<template>
  <PureTableBar title="账号导入" :columns="columns" @refresh="emit('refresh')">
    <template #buttons>
      <el-button
        type="primary"
        :icon="useRenderIcon(Upload)"
        @click="emit('create')"
      >
        导入协议号
      </el-button>
      <el-button :icon="useRenderIcon(RefreshRight)" @click="emit('refresh')">
        刷新
      </el-button>
    </template>

    <template #default="{ dynamicColumns }">
      <el-table v-loading="loading" :data="rows" row-key="id" border>
        <el-table-column
          v-if="!dynamicColumns[0].hide"
          prop="id"
          label="ID"
          width="90"
        />
        <el-table-column
          v-if="!dynamicColumns[1].hide"
          prop="filename"
          label="来源文件"
          min-width="180"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <strong>{{ row.filename || "-" }}</strong>
            <small v-if="row.remark">{{ row.remark }}</small>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[2].hide"
          prop="import_type"
          label="导入类型"
          width="120"
        />
        <el-table-column
          v-if="!dynamicColumns[3].hide"
          prop="group"
          label="分组"
          min-width="140"
          show-overflow-tooltip
        />
        <el-table-column
          v-if="!dynamicColumns[4].hide"
          prop="device"
          label="机型"
          width="100"
        />
        <el-table-column
          v-if="!dynamicColumns[5].hide"
          prop="account_type"
          label="账号类型"
          width="110"
        />
        <el-table-column
          v-if="!dynamicColumns[6].hide"
          label="任务进度"
          width="120"
        >
          <template #default="{ row }">{{
            progressLabel(toTask(row))
          }}</template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[7].hide"
          label="登录成功 / 失败"
          width="150"
        >
          <template #default="{ row }">
            {{ toTask(row).login_success ?? 0 }} /
            {{ accountImportLoginFailCount(toTask(row)) }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[8].hide"
          label="登录异常"
          width="160"
        >
          <template #default="{ row }">{{
            accountImportAbnormalLabel(toTask(row))
          }}</template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[9].hide"
          label="创建时间"
          width="180"
        >
          <template #default="{ row }">
            {{ formatDate(toTask(row).created_at) }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[10].hide"
          label="状态"
          width="110"
        >
          <template #default="{ row }">
            <el-tag size="small" :type="statusTagType(toTask(row).status)">
              {{ toTask(row).status || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[11].hide"
          label="操作"
          fixed="right"
          width="170"
        >
          <template #default="{ row }">
            <div class="account-import-actions">
              <el-button
                link
                type="primary"
                @click="emit('detail', toTask(row))"
              >
                明细
              </el-button>
              <el-dropdown
                trigger="click"
                @command="command => exportRow(toTask(row), String(command))"
              >
                <el-button
                  link
                  type="primary"
                  :loading="exportingTaskId === toTask(row).id"
                >
                  导出
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-for="item in exportOptions"
                      :key="item.value"
                      :command="item.value"
                    >
                      {{ item.label }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无账号导入任务" />
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
small {
  display: block;
  margin-top: 4px;
  color: var(--el-text-color-secondary);
}

.account-import-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  white-space: nowrap;
}
</style>
