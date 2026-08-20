<script setup lang="ts">
import { computed } from "vue";
import WheelPagination from "@/components/WheelPagination/index.vue";
import PullTaskDetailSummary from "./PullTaskDetailSummary.vue";
import PullTaskExecutionResourceActions from "./PullTaskExecutionResourceActions.vue";
import PullTaskLegacySupplementDrawer from "./PullTaskLegacySupplementDrawer.vue";
import PullTaskStandardExecutionResourceCounts from "./PullTaskStandardExecutionResourceCounts.vue";
import PullTaskStandardSavedSettings from "./PullTaskStandardSavedSettings.vue";
import PullTaskStandardTaskSummary from "./PullTaskStandardTaskSummary.vue";
import {
  formatEpoch,
  groupRowStatusLabel,
  groupRowStatusOptions,
  groupRowStatusTagType,
  standardStageLabel,
  standardStageOptions,
  standardWaitResourceOptions
} from "../constants";
import {
  formatGroupLinkUrl,
  standardCreateStepLabel
} from "../standard-execution-display";
import type {
  PullTaskGroupRow,
  PullTaskDetail,
  PullTaskRow,
  PullTaskStandardTaskSummary as StandardTaskSummary,
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
  detailTask: PullTaskDetail | null;
  standardTaskSummary: StandardTaskSummary | null;
  detailTotal: number;
}>();

const emit = defineEmits<{
  (event: "export-group-links"): void;
  (event: "export-report"): void;
  (event: "export-resources", kind: string): void;
  (event: "open-supplement"): void;
  (event: "open-manager-supplement", row: PullTaskGroupRow): void;
  (event: "open-execution-detail", row: PullTaskGroupRow): void;
  (event: "open-puller-supplement", row: PullTaskGroupRow): void;
  (event: "open-station-supplement", row: PullTaskGroupRow): void;
  (event: "refresh-detail-groups"): void;
  (event: "reset-detail-search"): void;
  (event: "run-group-operation", operation: string): void;
  (
    event: "run-task-operation",
    operation: "start" | "pause" | "resume" | "end"
  ): void;
  (
    event: "run-execution-operation",
    row: PullTaskGroupRow,
    operation: "pause" | "resume" | "end"
  ): void;
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

const normalLink = computed(
  () =>
    props.activeTask?.taskType === "STANDARD" &&
    props.activeTask.mode === "NORMAL_LINK"
);
const newGroupMode = computed(
  () =>
    normalLink.value &&
    (props.detailTask?.creationMode ?? props.activeTask?.creationMode) ===
      "NEW_GROUP"
);
const selectedGroupTip = computed(() =>
  props.detailSelectedCount > 0
    ? `已选 ${props.detailSelectedCount} 个群组`
    : "未选择群组时导出整批"
);
const allowedTaskActions = computed(
  () => props.activeTask?.allowedActions ?? []
);

function allowsTaskAction(
  action: "START" | "PAUSE" | "RESUME" | "END"
): boolean {
  return allowedTaskActions.value.includes(action);
}

function phoneList(value?: string[] | null): string {
  return value?.length ? value.join("、") : "-";
}

function countValue(value?: number | null): number | string {
  return value ?? "-";
}

function groupIdentity(row: PullTaskGroupRow): string {
  if (!normalLink.value) return row.groupName || "-";
  if (!newGroupMode.value) return row.groupJid || "-";
  return (
    row.groupName ||
    row.groupSubject ||
    row.sourceFileName?.replace(/\.txt$/i, "") ||
    standardCreateStepLabel(row.createStep)
  );
}

function groupNameLabel(row: PullTaskGroupRow): string {
  if (row.groupName || row.groupSubject) {
    return row.groupName || row.groupSubject || "";
  }
  if (!newGroupMode.value) return "-";
  return (
    row.sourceFileName?.replace(/\.txt$/i, "") ||
    standardCreateStepLabel(row.createStep)
  );
}
</script>

<template>
  <el-drawer
    v-model="visible"
    size="calc(100% - 210px)"
    destroy-on-close
    title="拉群任务详情"
  >
    <div class="detail-head">
      <div>
        <strong>{{ activeTask?.taskName || "拉群任务" }}</strong>
        <el-tag
          v-if="normalLink"
          size="small"
          :type="newGroupMode ? 'primary' : 'info'"
          effect="plain"
          data-testid="pull-task-detail-creation-mode"
        >
          {{ newGroupMode ? "新群模式" : "群链接模式" }}
        </el-tag>
        <small v-if="!normalLink">{{ selectedGroupTip }}</small>
      </div>
      <div v-if="!normalLink" class="detail-actions">
        <el-button
          v-auth="'tenant:pull_task:operate'"
          type="primary"
          plain
          @click="emit('open-supplement')"
        >
          批量补充拉手
        </el-button>
        <el-button
          v-auth="'tenant:pull_task:export'"
          @click="emit('export-report')"
          >导出报表</el-button
        >
        <el-button
          v-auth="'tenant:pull_task:export'"
          @click="emit('export-group-links')"
          >导出群链接</el-button
        >
        <el-dropdown
          v-auth="'tenant:pull_task:export'"
          @command="kind => emit('export-resources', kind)"
        >
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
      <div v-else class="detail-actions">
        <el-button @click="emit('refresh-detail-groups')">刷新</el-button>
        <el-button
          v-if="allowsTaskAction('START')"
          v-auth="'tenant:pull_task:operate'"
          type="success"
          @click="emit('run-task-operation', 'start')"
        >
          启动
        </el-button>
        <el-button
          v-if="allowsTaskAction('PAUSE')"
          v-auth="'tenant:pull_task:operate'"
          type="warning"
          @click="emit('run-task-operation', 'pause')"
        >
          暂停
        </el-button>
        <el-button
          v-if="allowsTaskAction('RESUME')"
          v-auth="'tenant:pull_task:operate'"
          type="success"
          @click="emit('run-task-operation', 'resume')"
        >
          恢复
        </el-button>
        <el-button
          v-if="allowsTaskAction('END')"
          v-auth="'tenant:pull_task:operate'"
          type="danger"
          @click="emit('run-task-operation', 'end')"
        >
          结束
        </el-button>
      </div>
    </div>

    <PullTaskStandardTaskSummary
      v-if="normalLink && standardTaskSummary"
      :summary="standardTaskSummary"
    />
    <PullTaskDetailSummary v-else :summary="detailSummary" />

    <PullTaskStandardSavedSettings
      v-if="
        normalLink && detailTask?.standardSetting && detailTask?.groupSetting
      "
      :visible="visible"
      :creation-mode="detailTask.creationMode"
      :standard-setting="detailTask.standardSetting"
      :group-setting="detailTask.groupSetting"
    />

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
      <el-form-item :label="newGroupMode ? '群名 / 料子' : '群链接'">
        <el-input
          v-model="searchForm.keyword"
          clearable
          class="search-keyword"
          :placeholder="newGroupMode ? '群名 / 料子包名称' : '群名 / 群链接'"
          @keyup.enter="emit('refresh-detail-groups')"
        />
      </el-form-item>
      <el-form-item v-if="normalLink" label="当前阶段">
        <el-select v-model="searchForm.stage" clearable class="search-select">
          <el-option
            v-for="item in standardStageOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item v-if="normalLink" label="资源异常">
        <el-select
          v-model="searchForm.waitResourceType"
          clearable
          class="search-select"
        >
          <el-option
            v-for="item in standardWaitResourceOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="emit('refresh-detail-groups')">
          查询
        </el-button>
        <el-button @click="emit('reset-detail-search')">重置</el-button>
        <el-dropdown
          v-if="!normalLink"
          @command="op => emit('run-group-operation', op)"
        >
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
        <el-dropdown
          v-if="!normalLink"
          @command="op => emit('run-rows-operation', op)"
        >
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
      <el-table-column v-if="!normalLink" type="selection" width="48" />
      <el-table-column prop="seq" label="序号" width="80" />
      <el-table-column
        v-if="normalLink"
        prop="groupName"
        label="群组名称"
        min-width="180"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          {{ groupNameLabel(row) }}
        </template>
      </el-table-column>
      <el-table-column label="群组" min-width="240" show-overflow-tooltip>
        <template #default="{ row }">
          <div class="name-cell">
            <strong>{{ groupIdentity(row) }}</strong>
            <small v-if="!newGroupMode || row.groupLinkUrl">
              {{ formatGroupLinkUrl(row.groupLinkUrl) }}
            </small>
            <small v-else data-testid="pull-task-group-create-step">
              建群步骤：{{ standardCreateStepLabel(row.createStep) }}
            </small>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        v-if="normalLink"
        prop="sourceFileName"
        label="料子包名称"
        min-width="180"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          {{ row.sourceFileName || "-" }}
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
      <el-table-column v-if="normalLink" label="当前阶段" width="150">
        <template #default="{ row }">
          {{ standardStageLabel(row.stage) }}
          <template v-if="row.stage === 9">
            / {{ standardCreateStepLabel(row.createStep) }}
          </template>
        </template>
      </el-table-column>
      <el-table-column v-if="normalLink" label="料子进度" min-width="230">
        <template #default="{ row }">
          <template v-if="row.materialSummary">
            成功 {{ row.materialSummary.successfulCount }} / 失败
            {{ row.materialSummary.failedCount }} / 未知
            {{ row.materialSummary.unknownCount }} / 剩余
            {{ row.materialSummary.remainingCount }}
          </template>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column
        v-if="!normalLink"
        prop="memberCount"
        label="群人数"
        width="100"
      />
      <el-table-column v-if="!normalLink" label="进入人数" width="100">
        <template #default="{ row }">{{
          countValue(row.joinedCount)
        }}</template>
      </el-table-column>
      <el-table-column v-if="!normalLink" label="异常" width="90">
        <template #default="{ row }">{{
          countValue(row.failedCount)
        }}</template>
      </el-table-column>
      <el-table-column v-if="!normalLink" label="未使用" width="90">
        <template #default="{ row }">{{
          countValue(row.unusedCount)
        }}</template>
      </el-table-column>
      <el-table-column v-if="!normalLink" label="交单" width="90">
        <template #default="{ row }">
          <el-tag size="small" :type="row.submitted ? 'success' : 'info'">
            {{ row.submitted ? "已交" : "未交" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        v-if="normalLink"
        label="执行资源（当前/计划）"
        min-width="230"
      >
        <template #default="{ row }">
          <PullTaskStandardExecutionResourceCounts :row="row" />
        </template>
      </el-table-column>
      <el-table-column
        v-if="normalLink"
        prop="blockReason"
        label="当前异常"
        min-width="180"
        show-overflow-tooltip
      />
      <el-table-column
        v-else
        label="管理员 / 拉手"
        min-width="220"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          管理员：{{ phoneList(row.adminPhones) }}<br />
          拉手：{{ phoneList(row.pullerPhones) }}
        </template>
      </el-table-column>
      <el-table-column
        :label="normalLink ? '最近执行时间' : '创建时间'"
        width="180"
      >
        <template #default="{ row }">
          {{
            formatEpoch(normalLink ? row.lastBusinessExecutedAt : row.createdAt)
          }}
        </template>
      </el-table-column>
      <el-table-column v-if="normalLink" label="操作" width="230" fixed="right">
        <template #default="{ row }">
          <PullTaskExecutionResourceActions
            :active-task="activeTask"
            :row="row"
            @detail="emit('open-execution-detail', row)"
            @lifecycle="emit('run-execution-operation', row, $event)"
            @manager="emit('open-manager-supplement', row)"
            @puller="emit('open-puller-supplement', row)"
            @station="emit('open-station-supplement', row)"
          />
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

  <PullTaskLegacySupplementDrawer
    v-if="!normalLink"
    v-model="supplementVisible"
    v-model:form="supplementForm"
    :account-groups="accountGroups"
    @submit="emit('supplement-pullers')"
  />
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

@media (width <= 900px) {
  .detail-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
