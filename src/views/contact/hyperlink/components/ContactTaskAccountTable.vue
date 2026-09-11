<script setup lang="ts">
import { onUnmounted, ref, watch } from "vue";
import {
  listContactTaskAccountData,
  type ContactTaskAccountItem,
  type ContactTaskMetrics
} from "@/api/contact-task";
import { accountStateLabels } from "../domain/receipt-metrics";
import ContactTaskProgress from "./ContactTaskProgress.vue";
const props = defineProps<{ taskId: number; refreshKey: number }>();
const emit = defineEmits<{
  (event: "recipients", account: ContactTaskAccountItem): void;
}>();
const rows = ref<ContactTaskAccountItem[]>([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const sortBy = ref<string>();
const sortOrder = ref<"asc" | "desc">();
const loading = ref(false);
const errorMessage = ref("");
let version = 0;
const columns: Array<{
  prop: keyof ContactTaskMetrics;
  label: string;
  sort: string;
}> = [
  { prop: "plannedNum", label: "计划条数", sort: "needSendNum" },
  { prop: "processedNum", label: "已处理", sort: "processedNum" },
  { prop: "confirmedNum", label: "已发送", sort: "sentNum" },
  { prop: "deliveredNum", label: "已送达", sort: "deliveredNum" },
  { prop: "readNum", label: "已读", sort: "readNum" },
  { prop: "failedNum", label: "明确失败", sort: "failNum" },
  { prop: "unknownNum", label: "结果未知", sort: "unknownNum" },
  { prop: "skippedNum", label: "已跳过", sort: "skippedNum" }
];
async function load() {
  const request = ++version;
  loading.value = true;
  errorMessage.value = "";
  try {
    const result = await listContactTaskAccountData(props.taskId, {
      page: page.value,
      pageSize: pageSize.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    });
    if (request !== version) return;
    rows.value = result.list;
    total.value = result.total;
  } catch (error) {
    if (request === version)
      errorMessage.value = (error as Error).message || "账号数据加载失败";
  } finally {
    if (request === version) loading.value = false;
  }
}
function changeSort({ prop, order }: { prop: string; order: string | null }) {
  sortBy.value =
    order && columns.some(column => column.sort === prop) ? prop : undefined;
  sortOrder.value = order
    ? order === "ascending"
      ? "asc"
      : "desc"
    : undefined;
  page.value = 1;
  load();
}
watch(
  () => [props.taskId, props.refreshKey],
  (next, previous) => {
    if (next[0] !== previous?.[0]) {
      rows.value = [];
      page.value = 1;
      total.value = 0;
      sortBy.value = undefined;
      sortOrder.value = undefined;
    }
    load();
  },
  { immediate: true }
);
onUnmounted(() => {
  version++;
});
</script>

<template>
  <el-alert
    v-if="errorMessage"
    :title="errorMessage"
    type="error"
    :closable="false"
    show-icon
  />
  <el-table
    v-loading="loading"
    :data="rows"
    row-key="taskAccountId"
    border
    @sort-change="changeSort"
  >
    <el-table-column
      prop="accountId"
      label="账号 ID"
      width="110"
      fixed="left"
    />
    <el-table-column label="执行状态" width="130"
      ><template #default="{ row }">{{
        accountStateLabels[row.state] ?? row.state
      }}</template></el-table-column
    >
    <el-table-column
      v-for="column in columns"
      :key="column.prop"
      :prop="column.sort"
      :label="column.label"
      width="115"
      sortable="custom"
      ><template #default="{ row }">{{
        row.metrics?.[column.prop] ?? "—"
      }}</template></el-table-column
    >
    <el-table-column label="执行进度" min-width="220"
      ><template #default="{ row }"
        ><ContactTaskProgress
          :metrics="row.metrics"
          :preparing="row.state === 'PREPARING'" /></template
    ></el-table-column>
    <el-table-column
      prop="stopReason"
      label="执行异常 / 跳过原因"
      min-width="220"
      show-overflow-tooltip
    />
    <el-table-column label="联系人" fixed="right" width="90"
      ><template #default="{ row }"
        ><el-button link type="primary" @click="emit('recipients', row)"
          >查看</el-button
        ></template
      ></el-table-column
    >
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
.data-pagination {
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}
</style>
