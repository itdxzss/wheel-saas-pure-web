<script setup lang="ts">
import { computed } from "vue";
import WheelPagination from "@/components/WheelPagination/index.vue";
import {
  formatEpoch,
  groupRowStatusLabel,
  groupRowStatusOptions,
  groupRowStatusTagType,
  pullTaskModeLabel,
  pullTaskStatusLabel
} from "../constants";
import type {
  PullTaskGroupRow,
  PullTaskRow,
  PullTaskSummary
} from "@/api/pull-task";
import type { AccountGroupApiRow } from "@/api/account-group";
import type {
  PullTaskDetailSearchForm,
  PullTaskSupplementForm
} from "../composables/usePullTaskPage";

defineOptions({
  name: "PullTaskDetailDrawer"
});

const props = defineProps<{
  accountGroups: AccountGroupApiRow[];
  activeTask: PullTaskRow | null;
  detailGroupRows: PullTaskGroupRow[];
  detailLoading: boolean;
  detailSelectedCount: number;
  detailSummary: PullTaskSummary;
  detailTotal: number;
}>();

const emit = defineEmits<{
  (event: "export-group-links"): void;
  (event: "export-report"): void;
  (event: "export-resources", kind: string): void;
  (event: "open-supplement"): void;
  (event: "refresh-detail-groups"): void;
  (event: "reset-detail-search"): void;
  (event: "run-group-operation", operation: string): void;
  (event: "run-rows-operation", operation: string): void;
  (event: "selection-change", rows: PullTaskGroupRow[]): void;
  (event: "supplement-pullers"): void;
}>();

const visible = defineModel<boolean>({ required: true });
const detailPage = defineModel<number>("detailPage", { required: true });
const detailPageSize = defineModel<number>("detailPageSize", {
  required: true
});
const searchForm = defineModel<PullTaskDetailSearchForm>("searchForm", {
  required: true
});
const supplementVisible = defineModel<boolean>("supplementVisible", {
  required: true
});
const supplementForm = defineModel<PullTaskSupplementForm>("supplementForm", {
  required: true
});

const selectedGroupTip = computed(() =>
  props.detailSelectedCount > 0
    ? `已选 ${props.detailSelectedCount} 个群组`
    : "未选择群组时导出整批"
);

function phoneList(value?: string[] | null): string {
  return value?.length ? value.join("、") : "-";
}
</script>

<template>
  <el-drawer
    v-model="visible"
    size="980px"
    destroy-on-close
    title="拉群任务详情"
  >
    <div class="detail-head">
      <div>
        <strong>{{ activeTask?.taskName || "拉群任务" }}</strong>
        <small>{{ selectedGroupTip }}</small>
      </div>
      <div class="detail-actions">
        <el-button type="primary" plain @click="emit('open-supplement')">
          批量补充拉手
        </el-button>
        <el-button @click="emit('export-report')">导出报表</el-button>
        <el-button @click="emit('export-group-links')">导出群链接</el-button>
        <el-dropdown @command="kind => emit('export-resources', kind)">
          <el-button>导出任务资源</el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="full">完整数据</el-dropdown-item>
              <el-dropdown-item command="unused">未使用数据</el-dropdown-item>
              <el-dropdown-item command="private">隐私资源</el-dropdown-item>
              <el-dropdown-item command="joined">已进群资源</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <span>任务状态</span>
        <strong>{{ pullTaskStatusLabel(detailSummary.status) }}</strong>
      </div>
      <div class="summary-card">
        <span>拉群模式</span>
        <strong>{{ pullTaskModeLabel(detailSummary.mode) }}</strong>
      </div>
      <el-statistic title="群组数量" :value="detailSummary.groupCount" />
      <el-statistic title="总群人数" :value="detailSummary.totalMembers" />
      <el-statistic title="异常数" :value="detailSummary.abnormalCount" />
      <el-statistic title="总进入人数" :value="detailSummary.joinedCount" />
      <el-statistic title="未使用数据" :value="detailSummary.unusedCount" />
      <el-statistic
        title="预计拉人数量"
        :value="detailSummary.expectedPullCount"
      />
    </div>

    <el-form :model="searchForm" inline class="detail-search">
      <el-form-item label="任务情况">
        <el-select v-model="searchForm.status" clearable class="search-select">
          <el-option
            v-for="item in groupRowStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="群链接">
        <el-input
          v-model="searchForm.keyword"
          clearable
          class="search-keyword"
          placeholder="群名 / 群链接"
          @keyup.enter="emit('refresh-detail-groups')"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="emit('refresh-detail-groups')">
          查询
        </el-button>
        <el-button @click="emit('reset-detail-search')">重置</el-button>
        <el-dropdown @command="op => emit('run-group-operation', op)">
          <el-button>批量群组操作</el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="CHECK_STATUS">
                批量检测群状态
              </el-dropdown-item>
              <el-dropdown-item command="SET_ADMIN">
                批量设置管理员
              </el-dropdown-item>
              <el-dropdown-item command="REFRESH_LINK">
                批量刷新群链接
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown @command="op => emit('run-rows-operation', op)">
          <el-button>批量任务操作</el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="END">批量完成任务</el-dropdown-item>
              <el-dropdown-item command="PAUSE">批量暂停任务</el-dropdown-item>
              <el-dropdown-item command="RESTART"
                >批量重启任务</el-dropdown-item
              >
              <el-dropdown-item command="UNSUBMIT"
                >取消交单标记</el-dropdown-item
              >
              <el-dropdown-item command="START">批量启动任务</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-form-item>
    </el-form>

    <el-table
      v-loading="detailLoading"
      :data="detailGroupRows"
      row-key="id"
      border
      @selection-change="emit('selection-change', $event)"
    >
      <el-table-column type="selection" width="48" />
      <el-table-column prop="seq" label="序号" width="80" />
      <el-table-column label="群组" min-width="240" show-overflow-tooltip>
        <template #default="{ row }">
          <div class="name-cell">
            <strong>{{ row.groupName || "-" }}</strong>
            <small>{{ row.groupLinkUrl || "-" }}</small>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="任务情况" width="130">
        <template #default="{ row }">
          <el-tag
            size="small"
            :type="groupRowStatusTagType(row.status)"
            effect="plain"
          >
            {{ groupRowStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="memberCount" label="群人数" width="100" />
      <el-table-column prop="joinedCount" label="进入人数" width="100" />
      <el-table-column prop="failedCount" label="异常" width="90" />
      <el-table-column prop="unusedCount" label="未使用" width="90" />
      <el-table-column label="交单" width="90">
        <template #default="{ row }">
          <el-tag size="small" :type="row.submitted ? 'success' : 'info'">
            {{ row.submitted ? "已交" : "未交" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="管理员 / 拉手"
        min-width="220"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          管理员：{{ phoneList(row.adminPhones) }}<br />
          拉手：{{ phoneList(row.pullerPhones) }}
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatEpoch(row.createdAt) }}
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无群组明细" />
      </template>
    </el-table>

    <WheelPagination
      v-model:current-page="detailPage"
      v-model:page-size="detailPageSize"
      :total="detailTotal"
      @change="emit('refresh-detail-groups')"
    />
  </el-drawer>

  <el-drawer
    v-model="supplementVisible"
    append-to-body
    size="420px"
    title="批量补充拉手"
  >
    <el-form :model="supplementForm" label-width="110px">
      <el-form-item label="拉手分组" required>
        <el-select
          v-model="supplementForm.accountGroupId"
          filterable
          class="form-control"
        >
          <el-option
            v-for="group in accountGroups"
            :key="group.id"
            :label="group.name"
            :value="group.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="每群补充数">
        <el-input-number v-model="supplementForm.countPerGroup" :min="1" />
      </el-form-item>
      <el-form-item label="进群方式">
        <el-select v-model="supplementForm.joinMode" class="form-control">
          <el-option label="慢速踩群链接" value="慢速踩群链接" />
          <el-option label="快速踩群链接" value="快速踩群链接" />
          <el-option label="管理员拉进群" value="管理员拉进群" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="supplementVisible = false">取消</el-button>
      <el-button type="primary" @click="emit('supplement-pullers')">
        确认补充
      </el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
.detail-head {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.detail-head strong,
.detail-head small,
.name-cell strong,
.name-cell small {
  display: block;
}

.detail-head small,
.name-cell small {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
}

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.summary-card,
.summary-grid :deep(.el-statistic) {
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
}

.summary-card span,
.summary-card strong {
  display: block;
}

.summary-card span {
  color: var(--el-text-color-secondary);
}

.summary-card strong {
  margin-top: 8px;
}

.detail-search {
  padding: 12px 12px 0;
  margin-bottom: 16px;
  background: var(--el-fill-color-lighter);
}

.search-keyword {
  width: 220px;
}

.search-select {
  width: 150px;
}

.form-control {
  width: 100%;
}

@media (width <= 900px) {
  .detail-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
