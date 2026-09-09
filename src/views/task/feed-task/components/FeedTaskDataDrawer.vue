<script setup lang="ts">
import { computed } from "vue";
import { hasPerms } from "@/utils/auth";
import { audienceLabel, audienceSource, canPrepareAudience } from "../audience";
import type { FeedTaskAccountRow } from "@/api/feed-task";
import WheelPagination from "@/components/WheelPagination/index.vue";
import { formatFeedTaskTime } from "../constants";

defineOptions({ name: "FeedTaskDataDrawer" });

const props = defineProps<{
  modelValue: boolean;
  taskName: string;
  rows: FeedTaskAccountRow[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  accountPhone: string;
  audienceRefreshingId: number | null;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "update:page", value: number): void;
  (event: "update:pageSize", value: number): void;
  (event: "update:accountPhone", value: string): void;
  (event: "search"): void;
  (event: "refreshAudience", row: FeedTaskAccountRow): void;
}>();

const currentPage = computed({
  get: () => props.page,
  set: value => emit("update:page", value)
});
const currentPageSize = computed({
  get: () => props.pageSize,
  set: value => emit("update:pageSize", value)
});

function statusType(
  status: string
): "success" | "info" | "warning" | "danger" | undefined {
  if (status === "success") return "success";
  if (status === "failed") return "danger";
  if (status === "retrying") return "warning";
  if (status === "sending" || status === "sent") return "info";
  return undefined;
}

function statusLabel(status: string): string {
  return (
    {
      pending: "待发送",
      sending: "发送中",
      sent: "已发送",
      success: "成功",
      failed: "失败",
      retrying: "重试中"
    }[status] ??
    (status || "-")
  );
}
</script>

<template>
  <el-drawer
    :model-value="modelValue"
    :title="`账号发送数据 · ${taskName}`"
    size="90%"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-alert
      title="当前候选受众"
      description="优先使用具名通讯录；Android 缺少通讯录时自动准备云端 LID。候选人数不代表实际可见或送达人数，发送时还会按账号隐私设置过滤。重新准备不会重发已完成或已失败的任务。"
      type="info"
      :closable="false"
      show-icon
      class="audience-notice"
    />
    <div class="data-toolbar">
      <el-input
        :model-value="accountPhone"
        clearable
        placeholder="按发送账号搜索"
        class="phone-search"
        @update:model-value="emit('update:accountPhone', $event)"
        @keyup.enter="emit('search')"
      />
      <el-button type="primary" :loading="loading" @click="emit('search')"
        >搜索 / 刷新</el-button
      >
    </div>
    <el-table v-loading="loading" :data="rows" border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="accountPhone" label="发送账号" min-width="190" />
      <el-table-column label="候选受众" min-width="250">
        <template #default="{ row }">
          <div>
            {{ audienceLabel(row.audience) }} ·
            {{ audienceSource(row.audience) }}
          </div>
          <div v-if="row.audience?.status === 'READY'">
            {{ row.audience.count }} 人
          </div>
          <div v-if="row.audience?.failReason" class="audience-failure">
            <span v-if="row.audience.failCode"
              >[{{ row.audience.failCode }}] </span
            >{{ row.audience.failReason }}
          </div>
          <div v-if="row.audience?.updatedAt" class="audience-updated">
            更新于
            {{
              formatFeedTaskTime(new Date(row.audience.updatedAt).toISOString())
            }}
          </div>
          <el-button
            v-if="
              hasPerms('tenant:feed_task:operate') &&
              canPrepareAudience(row.audience)
            "
            link
            type="primary"
            :loading="audienceRefreshingId === row.id"
            :disabled="audienceRefreshingId !== null"
            @click="emit('refreshAudience', row)"
            >重新准备</el-button
          >
        </template>
      </el-table-column>
      <el-table-column label="发送状态" width="110" align="center"
        ><template #default="{ row }"
          ><el-tag
            size="small"
            effect="plain"
            :type="statusType(row.sendStatus)"
            >{{ statusLabel(row.sendStatus) }}</el-tag
          ></template
        ></el-table-column
      >
      <el-table-column label="重试" width="90" align="center"
        ><template #default="{ row }"
          >{{ row.retryNum ?? 0 }} / {{ row.retryMax ?? 0 }}</template
        ></el-table-column
      >
      <el-table-column label="入队时间" width="170" align="center"
        ><template #default="{ row }">{{
          formatFeedTaskTime(row.sendAt)
        }}</template></el-table-column
      >
      <el-table-column label="完成时间" width="170" align="center"
        ><template #default="{ row }">{{
          formatFeedTaskTime(
            row.sendStatus === "failed" ? row.failedAt : row.successAt
          )
        }}</template></el-table-column
      >
      <el-table-column label="失败信息" min-width="240" show-overflow-tooltip
        ><template #default="{ row }">{{
          [row.failCode && `[${row.failCode}]`, row.failReason]
            .filter(Boolean)
            .join(" ") || "-"
        }}</template></el-table-column
      >
      <template #empty><el-empty description="暂无账号发送数据" /></template>
    </el-table>
    <WheelPagination
      v-model:current-page="currentPage"
      v-model:page-size="currentPageSize"
      :total="total"
      @change="emit('search')"
    />
  </el-drawer>
</template>

<style scoped>
.audience-notice {
  margin-bottom: 16px;
}

.audience-failure {
  font-size: 12px;
  color: var(--el-color-danger);
}

.audience-updated {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.data-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.phone-search {
  width: 260px;
}
</style>
