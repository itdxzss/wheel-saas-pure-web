<script setup lang="ts">
import { computed } from "vue";
import type { FeedTaskRow, FeedTaskAction } from "@/api/feed-task";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import WheelPagination from "@/components/WheelPagination/index.vue";
import Plus from "~icons/ep/plus";
import RefreshRight from "~icons/ep/refresh-right";
import View from "~icons/ep/view";
import List from "~icons/ep/list";
import Edit from "~icons/ep/edit";
import VideoPause from "~icons/ep/video-pause";
import VideoPlay from "~icons/ep/video-play";
import CircleClose from "~icons/ep/circle-close";
import {
  accountFilterSummary,
  feedTaskColumns,
  formatFeedTaskTime,
  taskStatusLabel,
  taskStatusType
} from "../constants";

function progress(success: number, total: number): number {
  return total ? Math.round((success / total) * 100) : 0;
}

defineOptions({ name: "FeedTaskTable" });

const props = defineProps<{
  rows: FeedTaskRow[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  runningCount: number;
  doneCount: number;
}>();

const emit = defineEmits<{
  (event: "create"): void;
  (event: "refresh"): void;
  (event: "update:page", value: number): void;
  (event: "update:pageSize", value: number): void;
  (event: "edit", row: FeedTaskRow): void;
  (event: "view", row: FeedTaskRow): void;
  (event: "data", row: FeedTaskRow): void;
  (event: "action", row: FeedTaskRow, action: FeedTaskAction): void;
}>();

const currentPage = computed({
  get: () => props.page,
  set: value => emit("update:page", value)
});
const currentPageSize = computed({
  get: () => props.pageSize,
  set: value => emit("update:pageSize", value)
});

function actionLabel(action: FeedTaskAction): string {
  return { start: "启动", pause: "暂停", resume: "恢复", stop: "停止" }[action];
}

function actionIcon(action: FeedTaskAction) {
  return {
    start: VideoPlay,
    pause: VideoPause,
    resume: VideoPlay,
    stop: CircleClose
  }[action];
}

function actions(row: FeedTaskRow): FeedTaskAction[] {
  if (row.status === 0) return [];
  if (row.taskStatus === 0) return ["start"];
  if (row.taskStatus === 1) return ["pause", "stop"];
  if (row.taskStatus === 3) return ["resume", "stop"];
  return [];
}
</script>

<template>
  <PureTableBar title="动态消息任务" :columns="feedTaskColumns" @refresh="emit('refresh')">
    <template #buttons>
      <el-tag type="info" effect="plain">本页进行中 {{ runningCount }}</el-tag>
      <el-tag type="success" effect="plain">本页已完成 {{ doneCount }}</el-tag>
      <el-button type="primary" :icon="useRenderIcon(Plus)" @click="emit('create')">新建动态消息任务</el-button>
      <el-button :icon="useRenderIcon(RefreshRight)" @click="emit('refresh')">刷新</el-button>
    </template>

    <template #default="{ dynamicColumns }">
      <el-table v-loading="loading" :data="rows" row-key="id" border>
        <el-table-column v-if="!dynamicColumns[0]?.hide" prop="id" label="ID" width="80" />
        <el-table-column v-if="!dynamicColumns[1]?.hide" label="动态 / 推广标题" min-width="270" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="title-cell">
              <span class="color-chip" :style="{ backgroundColor: row.backgroundColor, color: row.textColor }">Aa</span>
              <div class="title-copy">
                <div class="title-line"><span>{{ row.title || "未填写标题" }}</span><el-tag size="small" effect="plain" :type="row.taskMode === 'rolling' ? 'info' : ''">{{ row.taskMode === "rolling" ? "预发布" : "即时" }}</el-tag></div>
                <span class="link-line">{{ row.promotionLink || "-" }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column v-if="!dynamicColumns[2]?.hide" label="状态" width="110" align="center">
          <template #default="{ row }"><el-tag size="small" effect="plain" :type="taskStatusType(row)">{{ taskStatusLabel(row) }}</el-tag></template>
        </el-table-column>
        <el-table-column v-if="!dynamicColumns[3]?.hide" label="进度（成功 / 失败 / 总数）" width="210" align="center">
          <template #default="{ row }">
            <div class="progress-cell"><div class="progress-label"><span class="success-text">成功 {{ row.successAccountNum ?? 0 }}</span><span class="danger-text">失败 {{ row.failedAccountNum ?? 0 }}</span><span>共 {{ row.totalAccountNum ?? 0 }}</span></div><el-progress :percentage="progress(row.successAccountNum, row.totalAccountNum)" :show-text="false" status="success" /></div>
          </template>
        </el-table-column>
        <el-table-column v-if="!dynamicColumns[4]?.hide" label="账号范围" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">{{ accountFilterSummary(row.accountFilter) }}</template>
        </el-table-column>
        <el-table-column v-if="!dynamicColumns[5]?.hide" prop="totalAccountNum" label="使用号数" width="100" align="center" />
        <el-table-column v-if="!dynamicColumns[6]?.hide" label="曝光人数" width="100" align="center"><template #default>N</template></el-table-column>
        <el-table-column v-if="!dynamicColumns[7]?.hide" label="号均曝光量" width="110" align="center"><template #default>N</template></el-table-column>
        <el-table-column v-if="!dynamicColumns[8]?.hide" label="计划开始时间" width="170" align="center"><template #default="{ row }">{{ formatFeedTaskTime(row.taskStartAt) }}</template></el-table-column>
        <el-table-column v-if="!dynamicColumns[9]?.hide" label="计划结束时间" width="170" align="center"><template #default="{ row }">{{ formatFeedTaskTime(row.taskPlannedEndAt) }}</template></el-table-column>
        <el-table-column label="操作" fixed="right" width="270" align="center">
          <template #default="{ row }">
            <el-button v-for="action in actions(row)" :key="action" link :type="action === 'stop' ? 'danger' : 'primary'" :icon="useRenderIcon(actionIcon(action))" @click="emit('action', row, action)">{{ actionLabel(action) }}</el-button>
            <el-button v-if="row.taskStatus === 0" link type="primary" :icon="useRenderIcon(Edit)" @click="emit('edit', row)">编辑</el-button>
            <el-button v-else link type="primary" :icon="useRenderIcon(View)" @click="emit('view', row)">查看</el-button>
            <el-button link type="primary" :icon="useRenderIcon(List)" @click="emit('data', row)">账号数据</el-button>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无动态发布任务" /></template>
      </el-table>
      <WheelPagination v-model:current-page="currentPage" v-model:page-size="currentPageSize" :total="total" @change="emit('refresh')" />
    </template>
  </PureTableBar>
</template>

<style scoped>
.title-cell { display: flex; align-items: center; gap: 10px; min-width: 0; }
.color-chip { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; flex: 0 0 auto; border-radius: 6px; font-weight: 700; }
.title-copy { min-width: 0; }
.title-line { display: flex; align-items: center; gap: 6px; min-width: 0; font-weight: 600; }
.title-line > span:first-child, .link-line { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.link-line { display: block; margin-top: 3px; color: var(--el-text-color-secondary); font-size: 12px; }
.progress-label { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; }
.success-text { color: var(--el-color-success); }.danger-text { color: var(--el-color-danger); }
</style>
