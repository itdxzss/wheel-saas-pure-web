<script setup lang="ts">
import { computed } from "vue";
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
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "update:page", value: number): void;
  (event: "update:pageSize", value: number): void;
  (event: "update:accountPhone", value: string): void;
  (event: "search"): void;
}>();

const currentPage = computed({
  get: () => props.page,
  set: value => emit("update:page", value)
});
const currentPageSize = computed({
  get: () => props.pageSize,
  set: value => emit("update:pageSize", value)
});

function statusType(status: string): "success" | "info" | "warning" | "danger" | "" {
  if (status === "success") return "success";
  if (status === "failed") return "danger";
  if (status === "retrying") return "warning";
  if (status === "sending" || status === "sent") return "info";
  return "";
}

function statusLabel(status: string): string {
  return (
    { pending: "待发送", sending: "发送中", sent: "已发送", success: "成功", failed: "失败", retrying: "重试中" }[status] ??
    (status || "-")
  );
}
</script>

<template>
  <el-drawer :model-value="modelValue" :title="`账号发送数据 · ${taskName}`" size="1080px" @update:model-value="emit('update:modelValue', $event)">
    <div class="data-toolbar">
      <el-input :model-value="accountPhone" clearable placeholder="按发送账号搜索" class="phone-search" @update:model-value="emit('update:accountPhone', $event)" @keyup.enter="emit('search')" />
      <el-button type="primary" @click="emit('search')">搜索</el-button>
    </div>
    <el-table v-loading="loading" :data="rows" border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="accountPhone" label="发送账号" min-width="190" />
      <el-table-column label="发送状态" width="110" align="center"><template #default="{ row }"><el-tag size="small" effect="plain" :type="statusType(row.sendStatus)">{{ statusLabel(row.sendStatus) }}</el-tag></template></el-table-column>
      <el-table-column label="重试" width="90" align="center"><template #default="{ row }">{{ row.retryNum ?? 0 }} / {{ row.retryMax ?? 0 }}</template></el-table-column>
      <el-table-column label="入队时间" width="170" align="center"><template #default="{ row }">{{ formatFeedTaskTime(row.sendAt) }}</template></el-table-column>
      <el-table-column label="完成时间" width="170" align="center"><template #default="{ row }">{{ formatFeedTaskTime(row.sendStatus === 'failed' ? row.failedAt : row.successAt) }}</template></el-table-column>
      <el-table-column label="失败信息" min-width="240" show-overflow-tooltip><template #default="{ row }">{{ [row.failCode && `[${row.failCode}]`, row.failReason].filter(Boolean).join(" ") || "-" }}</template></el-table-column>
      <template #empty><el-empty description="暂无账号发送数据" /></template>
    </el-table>
    <WheelPagination v-model:current-page="currentPage" v-model:page-size="currentPageSize" :total="total" @change="emit('search')" />
  </el-drawer>
</template>

<style scoped>
.data-toolbar { display: flex; gap: 8px; margin-bottom: 16px; }.phone-search { width: 260px; }
</style>
