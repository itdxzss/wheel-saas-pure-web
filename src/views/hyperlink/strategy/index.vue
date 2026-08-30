<script setup lang="ts">
import { computed, ref } from "vue";
import WheelPagination from "@/components/WheelPagination/index.vue";
import {
  countHyperlinkStrategyAccounts,
  type HyperlinkStrategyListItem
} from "@/api/hyperlink-strategy";
import HyperlinkAccountFilterDrawer from "../task/components/HyperlinkAccountFilterDrawer.vue";
import { accountFilterSummary } from "../task/domain/editor-rules";
import HyperlinkStrategyDialog from "./components/HyperlinkStrategyDialog.vue";
import { useHyperlinkStrategyPage } from "./composables/useHyperlinkStrategyPage";
import {
  STRATEGY_TASK_MODES,
  strategyTaskModeLabel
} from "./domain/strategy-form";

defineOptions({ name: "HyperlinkStrategy" });

const {
  rows,
  page,
  pageSize,
  total,
  loading,
  errorMessage,
  filters,
  dialogVisible,
  detailLoading,
  saving,
  editingId,
  form,
  filterVisible,
  filterOptions,
  defaultGroupIds,
  optionErrors,
  contextLoading,
  match,
  matching,
  matchError,
  refresh,
  search,
  reset,
  loadAccountContext,
  retryMatch,
  openCreate,
  openEdit,
  save,
  remove
} = useHyperlinkStrategyPage();

type ColumnKey =
  | "id"
  | "name"
  | "status"
  | "scope"
  | "executing"
  | "use"
  | "send"
  | "cycle"
  | "created";
const allColumns: Array<{ value: ColumnKey; label: string }> = [
  { value: "id", label: "ID" },
  { value: "name", label: "策略名称" },
  { value: "status", label: "状态" },
  { value: "scope", label: "账号范围" },
  { value: "executing", label: "最大执行账号" },
  { value: "use", label: "最大使用账号" },
  { value: "send", label: "单号发送上限" },
  { value: "cycle", label: "周期" },
  { value: "created", label: "创建时间" }
];
const visibleColumns = ref<ColumnKey[]>(allColumns.map(item => item.value));
const currentEnabled = computed(
  () => rows.value.filter(row => row.enabled).length
);
const currentDisabled = computed(
  () => rows.value.length - currentEnabled.value
);
const taskModeFilter = computed({
  get: () => filters.taskMode ?? "",
  set: value => {
    filters.taskMode = value || undefined;
  }
});
const hasColumn = (key: ColumnKey) => visibleColumns.value.includes(key);

function scopeTags(row: HyperlinkStrategyListItem): string[] {
  const tags = accountFilterSummary(row.accountFilter);
  return tags.length ? tags : ["不限账号范围"];
}

function formatPeriod(minutes: number): string {
  if (minutes % 1440 === 0) return `每 ${minutes / 1440} 天`;
  if (minutes % 60 === 0) return `每 ${minutes / 60} 小时`;
  return `每 ${minutes} 分钟`;
}

function formatTime(value: number | string): string {
  return value
    ? new Date(typeof value === "number" ? value : value).toLocaleString(
        "zh-CN",
        { hour12: false }
      )
    : "—";
}
</script>

<template>
  <div class="strategy-page">
    <el-card shadow="never" class="intro-card">
      <div class="page-heading">
        <div>
          <h2>超链发送策略</h2>
          <p>
            复用任务模式、账号范围和发送限额；不绑定消息内容、数据包或启动时机。
          </p>
        </div>
        <div class="heading-actions">
          <el-tag type="success">当前页已启用 {{ currentEnabled }}</el-tag>
          <el-tag type="info">当前页已停用 {{ currentDisabled }}</el-tag>
          <el-button
            v-auth="'tenant:hyperlink_strategy:create'"
            type="primary"
            @click="openCreate"
          >
            新建策略
          </el-button>
        </div>
      </div>
      <el-alert
        title="模板弱引用：策略仅作为新建任务的配置来源；任务保存独占快照，修改或删除模板不会改变存量任务。"
        type="info"
        :closable="false"
      />
    </el-card>

    <el-card shadow="never" class="search-card">
      <el-form inline @submit.prevent="search">
        <el-form-item label="策略名称">
          <el-input
            v-model="filters.name"
            clearable
            placeholder="模糊搜索"
            @keyup.enter="search"
          />
        </el-form-item>
        <el-form-item label="任务模式">
          <el-radio-group v-model="taskModeFilter">
            <el-radio-button value="">全部</el-radio-button>
            <el-radio-button
              v-for="item in STRATEGY_TASK_MODES"
              :key="item.value"
              :value="item.value"
              >{{ item.label }}</el-radio-button
            >
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.enabled" clearable placeholder="全部">
            <el-option label="启用" :value="true" />
            <el-option label="停用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-alert
      v-if="errorMessage"
      :title="errorMessage"
      type="error"
      show-icon
      :closable="false"
      class="error-alert"
    >
      <el-button link type="primary" @click="refresh">重新加载</el-button>
    </el-alert>

    <el-card shadow="never">
      <template #header>
        <div class="table-toolbar">
          <span>共 {{ total }} 份可复用策略</span>
          <div>
            <el-popover placement="bottom-end" :width="220" trigger="click">
              <template #reference>
                <el-button>列设置</el-button>
              </template>
              <el-checkbox-group
                v-model="visibleColumns"
                class="column-settings"
              >
                <el-checkbox
                  v-for="column in allColumns"
                  :key="column.value"
                  :value="column.value"
                >
                  {{ column.label }}
                </el-checkbox>
              </el-checkbox-group>
            </el-popover>
            <el-button :loading="loading" @click="refresh">刷新</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" :data="rows" row-key="id">
        <el-table-column
          v-if="hasColumn('id')"
          prop="id"
          label="ID"
          width="90"
        />
        <el-table-column
          v-if="hasColumn('name')"
          label="策略名称"
          min-width="210"
        >
          <template #default="{ row }">
            <div class="strategy-name">
              <b>{{ row.name }}</b>
              <el-tag size="small" effect="plain">{{
                strategyTaskModeLabel(row.taskMode)
              }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          v-if="hasColumn('status')"
          label="状态"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'">
              {{ row.enabled ? "已启用" : "已停用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          v-if="hasColumn('scope')"
          label="账号范围"
          min-width="250"
        >
          <template #default="{ row }">
            <div class="scope-tags">
              <el-tag
                v-for="tag in scopeTags(row).slice(0, 3)"
                :key="tag"
                size="small"
                effect="plain"
              >
                {{ tag }}
              </el-tag>
              <el-tooltip
                v-if="scopeTags(row).length > 3"
                :content="scopeTags(row).slice(3).join('、')"
                placement="top"
              >
                <el-tag size="small" type="info"
                  >+{{ scopeTags(row).length - 3 }}</el-tag
                >
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          v-if="hasColumn('executing')"
          label="最大执行账号"
          width="130"
          align="right"
        >
          <template #default="{ row }">{{
            row.maxExecutingAccounts === 0 ? "均分" : row.maxExecutingAccounts
          }}</template>
        </el-table-column>
        <el-table-column
          v-if="hasColumn('use')"
          label="最大使用账号"
          width="140"
          align="right"
        >
          <template #default="{ row }">{{
            row.maxUseAccounts || "不限"
          }}</template>
        </el-table-column>
        <el-table-column
          v-if="hasColumn('send')"
          label="单号发送上限"
          width="140"
          align="right"
        >
          <template #default="{ row }">{{
            row.maxSendPerAccount || "不限"
          }}</template>
        </el-table-column>
        <el-table-column
          v-if="hasColumn('cycle')"
          label="周期"
          width="130"
          align="right"
        >
          <template #default="{ row }">{{
            row.taskMode === "cycle"
              ? formatPeriod(row.cycleIntervalMinutes)
              : "—"
          }}</template>
        </el-table-column>
        <el-table-column
          v-if="hasColumn('created')"
          label="创建时间"
          width="180"
        >
          <template #default="{ row }">{{
            formatTime(row.createdAt)
          }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              v-auth="'tenant:hyperlink_strategy:edit'"
              link
              type="primary"
              @click="openEdit(row)"
              >编辑</el-button
            >
            <span v-auth="'tenant:hyperlink_strategy:delete'">
              <el-popconfirm
                :title="`确认删除策略「${row.name}」？此操作不可恢复。`"
                confirm-button-text="删除"
                cancel-button-text="取消"
                @confirm="remove(row)"
              >
                <template #reference>
                  <el-button link type="danger">删除</el-button>
                </template>
              </el-popconfirm>
            </span>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无超链策略" /></template>
      </el-table>

      <WheelPagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        @change="refresh"
      />
    </el-card>

    <HyperlinkStrategyDialog
      v-model="dialogVisible"
      v-model:form="form"
      :editing="editingId != null"
      :loading="saving"
      :detail-loading="detailLoading"
      :context-loading="contextLoading"
      :context-error="optionErrors['创建上下文']"
      :match="match"
      :matching="matching"
      :match-error="matchError"
      @save="save"
      @open-filter="filterVisible = true"
      @retry-context="loadAccountContext(true)"
      @retry-match="retryMatch"
    />

    <HyperlinkAccountFilterDrawer
      v-model="filterVisible"
      v-model:value="form.accountFilter"
      :options="filterOptions"
      :default-group-ids="defaultGroupIds"
      :option-errors="optionErrors"
      :count-accounts="countHyperlinkStrategyAccounts"
    />
  </div>
</template>

<style scoped>
.strategy-page {
  padding: 16px;
}

.intro-card,
.search-card,
.error-alert {
  margin-bottom: 12px;
}

.intro-card :deep(.el-card__body) {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  align-items: center;
}

h2,
p {
  margin: 0;
}

p {
  color: var(--el-text-color-secondary);
}

.page-heading,
.heading-actions,
.table-toolbar,
.table-toolbar > div,
.scope-tags {
  display: flex;
  gap: 10px;
  align-items: center;
}

.page-heading,
.table-toolbar {
  justify-content: space-between;
}

.page-heading > div:first-child {
  display: grid;
  gap: 6px;
}

.strategy-name {
  display: flex;
  gap: 8px;
  align-items: center;
}

.scope-tags {
  flex-wrap: wrap;
}

.column-settings {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

@media (width <= 760px) {
  .page-heading,
  .heading-actions {
    flex-wrap: wrap;
  }
}
</style>
