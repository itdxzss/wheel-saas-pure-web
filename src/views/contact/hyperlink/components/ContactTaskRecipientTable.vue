<script setup lang="ts">
import { onUnmounted, ref, watch } from "vue";
import dayjs from "dayjs";
import {
  queryContactTaskRecipients,
  type ContactTaskRecipient
} from "@/api/contact-task";
import {
  receiptFilters,
  receiptLabel,
  receiptQuery,
  sendStatusLabels,
  type ReceiptFilter
} from "../domain/receipt-metrics";
const props = defineProps<{
  taskId: number;
  refreshKey: number;
  initialFilter: ReceiptFilter;
  initialAccountId?: number;
  initialErrorCode?: string;
}>();
const filter = ref(props.initialFilter);
const accountId = ref(props.initialAccountId);
const errorCode = ref(props.initialErrorCode ?? "");
const rows = ref<ContactTaskRecipient[]>([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const loading = ref(false);
const errorMessage = ref("");
let version = 0;
function time(value: number | null): string {
  return value == null ? "—" : dayjs(value).format("MM-DD HH:mm:ss");
}
async function load() {
  const request = ++version;
  loading.value = true;
  errorMessage.value = "";
  try {
    const result = await queryContactTaskRecipients(props.taskId, {
      ...receiptQuery(filter.value),
      taskAccountId: accountId.value,
      errorCode: errorCode.value.trim() || undefined,
      page: page.value,
      pageSize: pageSize.value
    });
    if (request !== version) return;
    rows.value = result.list;
    total.value = result.total;
  } catch (error) {
    if (request === version)
      errorMessage.value = (error as Error).message || "联系人明细加载失败";
  } finally {
    if (request === version) loading.value = false;
  }
}
function search() {
  page.value = 1;
  load();
}
watch(
  () => [props.taskId, props.refreshKey],
  () => load(),
  { immediate: true }
);
onUnmounted(() => {
  version++;
});
</script>

<template>
  <div class="recipient-tools">
    <el-select
      v-model="filter"
      aria-label="处理结果与回执筛选"
      style="width: 180px"
      @change="
        errorCode = '';
        search();
      "
      ><el-option
        v-for="item in receiptFilters"
        :key="item.value"
        :label="item.label"
        :value="item.value"
    /></el-select>
    <el-input
      v-model="errorCode"
      placeholder="按原因码筛选"
      aria-label="原因码"
      clearable
      maxlength="64"
      style="width: 220px"
      @keyup.enter="search"
      @clear="search"
    />
    <el-button @click="search">查询</el-button>
    <el-tag
      v-if="accountId != null"
      closable
      @close="
        accountId = undefined;
        search();
      "
      >任务账号 #{{ accountId }}</el-tag
    >
    <span>共 {{ total }} 条</span>
  </div>
  <el-alert
    v-if="errorMessage"
    :title="errorMessage"
    type="error"
    :closable="false"
    show-icon
  />
  <el-table v-loading="loading" :data="rows" row-key="id" border>
    <el-table-column prop="contactJid" label="联系人 JID" min-width="200" />
    <el-table-column prop="accountId" label="发信账号 ID" width="120" />
    <el-table-column label="处理状态" width="160"
      ><template #default="{ row }">{{
        sendStatusLabels[row.sendStatus] ?? row.sendStatus
      }}</template></el-table-column
    >
    <el-table-column label="最高回执" width="150"
      ><template #default="{ row }"
        ><span :class="{ 'read-receipt': row.readAt != null }">{{
          receiptLabel(row)
        }}</span></template
      ></el-table-column
    >
    <el-table-column label="首次发送确认" width="160"
      ><template #default="{ row }">{{
        time(row.firstSentAt)
      }}</template></el-table-column
    >
    <el-table-column label="首次送达确认" width="160"
      ><template #default="{ row }">{{
        time(row.deliveredAt)
      }}</template></el-table-column
    >
    <el-table-column label="首次已读确认" width="160"
      ><template #default="{ row }">{{
        time(row.readAt)
      }}</template></el-table-column
    >
    <el-table-column
      prop="errorCode"
      label="原因码"
      min-width="180"
      show-overflow-tooltip
    />
    <el-table-column
      prop="errorDesc"
      label="原因"
      min-width="240"
      show-overflow-tooltip
    />
  </el-table>
  <el-pagination
    v-model:current-page="page"
    v-model:page-size="pageSize"
    :total="total"
    :page-sizes="[10, 20, 50, 100, 200]"
    layout="total, sizes, prev, pager, next"
    class="data-pagination"
    @current-change="load"
    @size-change="
      page = 1;
      load();
    "
  />
</template>

<style scoped>
.recipient-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 16px;
}

.data-pagination {
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.read-receipt {
  color: var(--el-color-primary);
}
</style>
