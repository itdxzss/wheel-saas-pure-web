<script setup lang="ts">
import { computed } from "vue";
import WheelPagination from "@/components/WheelPagination/index.vue";
import type {
  AccountImportDetailRow,
  AccountImportFailReason,
  AccountImportTask
} from "@/api/account-import";
import {
  accountImportAbnormalCount,
  accountImportLoginFailCount
} from "../account-import-display";
import { detailStatusOptions } from "../constants";
import type {
  AccountImportDetailStatus,
  AccountImportExportKind
} from "../types";

defineOptions({
  name: "AccountImportDetailDrawer"
});

const props = defineProps<{
  detailRows: AccountImportDetailRow[];
  failReasons: AccountImportFailReason[];
  loading: boolean;
  modelValue: boolean;
  page: number;
  pageSize: number;
  statusFilter: AccountImportDetailStatus;
  task: AccountImportTask | null;
  total: number;
}>();

const emit = defineEmits<{
  (
    event: "export",
    row: AccountImportTask,
    kind: AccountImportExportKind
  ): void;
  (event: "filter-change", value: AccountImportDetailStatus): void;
  (event: "refresh"): void;
  (event: "update:modelValue", value: boolean): void;
  (event: "update:page", value: number): void;
  (event: "update:pageSize", value: number): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});
const currentPage = computed({
  get: () => props.page,
  set: value => emit("update:page", value)
});
const currentPageSize = computed({
  get: () => props.pageSize,
  set: value => emit("update:pageSize", value)
});
const drawerTitle = computed(() =>
  props.task ? `导入任务 ${props.task.id} · 明细` : "导入明细"
);

function formatDate(value?: string | null): string {
  if (!value) return "-";
  return value.replace("T", " ").slice(0, 19);
}

function statusTagType(
  status?: string
): "success" | "danger" | "warning" | "info" {
  if (status === "成功") return "success";
  if (status === "失败") return "danger";
  if (status === "异常") return "warning";
  return "info";
}

function taskStatusTagType(status?: string): "success" | "warning" | "info" {
  if (status === "已完成") return "success";
  if (status === "导入中" || status === "进行中") return "warning";
  return "info";
}

function filterDetail(value: string | number | boolean): void {
  emit("filter-change", value as AccountImportDetailStatus);
}
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="drawerTitle"
    size="820px"
    destroy-on-close
  >
    <div v-if="task" class="account-import-detail">
      <div class="detail-summary">
        <div class="detail-summary-main">
          <div class="detail-summary-title">
            <strong>导入明细</strong>
            <el-tag type="success" effect="light">
              {{ task.import_type || "未知类型" }}
            </el-tag>
            <el-tag :type="taskStatusTagType(task.status)" effect="light">
              {{ task.status || "-" }}
            </el-tag>
          </div>
          <div class="detail-summary-meta">
            <span>{{ task.filename || "-" }}</span>
            <span>创建时间 {{ formatDate(task.created_at) }}</span>
            <span>当前展示 {{ detailRows.length }} 条明细记录</span>
          </div>
        </div>
        <div class="detail-summary-actions">
          <el-button @click="emit('export', task, 'ALL')">导出全部</el-button>
          <el-button @click="emit('export', task, 'FAIL')">导出失败</el-button>
        </div>
      </div>

      <div class="detail-stats">
        <el-card shadow="never">
          <el-statistic title="登录成功" :value="task.login_success ?? 0" />
        </el-card>
        <el-card shadow="never">
          <el-statistic
            title="登录失败"
            :value="accountImportLoginFailCount(task)"
          />
        </el-card>
        <el-card shadow="never">
          <el-statistic
            title="登录异常"
            :value="accountImportAbnormalCount(task)"
          />
        </el-card>
      </div>

      <el-card class="mt-3" shadow="never">
        <template #header>
          <strong>导入配置参数</strong>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="导入总数">
            {{ task.total ?? 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="账号分组">
            {{ task.group || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="机型">
            {{ task.device || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="账号类型">
            {{ task.account_type || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="IP分配">
            {{ task.ip_mode || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="来源文件">
            {{ task.filename || "-" }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card class="mt-3" shadow="never">
        <template #header>
          <strong>失败原因概览</strong>
        </template>
        <el-empty
          v-if="failReasons.length === 0"
          description="暂无失败原因"
          :image-size="80"
        />
        <div v-else class="fail-reason-list">
          <el-tag
            v-for="item in failReasons"
            :key="item.reason"
            type="danger"
            effect="plain"
          >
            {{ item.reason || "未返回原因" }}：{{ item.count }}
          </el-tag>
        </div>
      </el-card>

      <el-card class="mt-3" shadow="never">
        <template #header>
          <div class="drawer-card-header">
            <strong>登录结果展示</strong>
            <el-radio-group
              :model-value="statusFilter"
              size="small"
              @change="filterDetail"
            >
              <el-radio-button
                v-for="item in detailStatusOptions"
                :key="item.value"
                :label="item.value"
              >
                {{ item.label }}
              </el-radio-button>
            </el-radio-group>
          </div>
        </template>

        <el-table v-loading="loading" :data="detailRows" border>
          <el-table-column prop="line" label="行号" width="90" />
          <el-table-column
            prop="account"
            label="账号"
            min-width="150"
            show-overflow-tooltip
          />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="statusTagType(row.status)">
                {{ row.status || "-" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="reason"
            label="失败原因"
            min-width="180"
            show-overflow-tooltip
          />
          <el-table-column
            prop="group"
            label="分组"
            min-width="130"
            show-overflow-tooltip
          />
          <el-table-column label="创建时间" width="180">
            <template #default="{ row }">{{
              formatDate(row.created_at)
            }}</template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无明细数据" />
          </template>
        </el-table>

        <WheelPagination
          v-model:current-page="currentPage"
          v-model:page-size="currentPageSize"
          :total="total"
          @change="emit('refresh')"
        />
      </el-card>
    </div>
    <el-empty v-else description="未选择导入任务" />
  </el-drawer>
</template>

<style scoped>
.detail-summary {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  margin-bottom: 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
}

.detail-summary-main {
  min-width: 0;
}

.detail-summary-title {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.detail-summary-title strong {
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.detail-summary-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  color: var(--el-text-color-secondary);
}

.detail-summary-meta span:not(:last-child)::after {
  padding-left: 12px;
  content: "·";
}

.detail-summary-actions {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
}

.detail-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(120px, 1fr));
  gap: 8px;
}

.drawer-card-header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.fail-reason-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (width <= 768px) {
  .detail-summary {
    flex-direction: column;
    align-items: flex-start;
  }

  .detail-summary-actions {
    flex-wrap: wrap;
  }

  .detail-summary-meta {
    flex-direction: column;
    gap: 4px;
  }

  .detail-summary-meta span::after {
    display: none;
  }

  .detail-stats {
    grid-template-columns: 1fr;
  }

  .drawer-card-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
