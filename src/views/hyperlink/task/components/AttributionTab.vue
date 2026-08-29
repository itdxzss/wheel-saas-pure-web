<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { PureTableBar } from "@/components/RePureTableBar";
import WheelPagination from "@/components/WheelPagination/index.vue";
import {
  exportHyperlinkAttribution,
  downloadHyperlinkTaskExport,
  formatHyperlinkTime,
  getHyperlinkAttribution,
  waitForHyperlinkTaskExport,
  type HyperlinkAttributionItem
} from "@/api/hyperlink-task-analysis";
import { apiErrorMessage } from "@/utils/api-error";
import { downloadBlobFile } from "@/utils/download";
import { hasPerms } from "@/utils/auth";
import AttributionIpCell from "./AttributionIpCell.vue";

defineOptions({ name: "HyperlinkAttributionTab" });
const props = defineProps<{ taskId: number; successNum: number }>();

const recipientPhone = ref("");
const senderPhone = ref("");
const page = ref(1);
const pageSize = ref(20);
const sortOrder = ref<"asc" | "desc">("desc");
const rows = ref<HyperlinkAttributionItem[]>([]);
const total = ref(0);
const loading = ref(false);
const exporting = ref(false);
const errorMessage = ref("");
let requestSequence = 0;
let exportAbort: AbortController | undefined;

const columns: TableColumnList = [
  { label: "收件人手机号", prop: "recipientPhone" },
  { label: "发送账号", prop: "senderPhone" },
  { label: "访问次数", prop: "visitCount" },
  { label: "国家/地区", prop: "countryIso2" },
  { label: "设备", prop: "device" },
  { label: "操作系统", prop: "os" },
  { label: "浏览器", prop: "browser" },
  { label: "语言", prop: "language" },
  { label: "IP", prop: "ip" },
  { label: "首次访问", prop: "firstVisitAt" },
  { label: "最近访问", prop: "lastVisitAt" }
];

const clickRate = computed(() =>
  props.successNum > 0
    ? `${((total.value / props.successNum) * 100).toFixed(2)}%`
    : "-"
);
const canSensitiveExport = computed(() =>
  hasPerms([
    "tenant:hyperlink_task:export",
    "tenant:hyperlink_task:attribution_sensitive"
  ])
);

watch(
  () => props.taskId,
  () => void load(),
  { immediate: true }
);
onBeforeUnmount(() => exportAbort?.abort());

function query() {
  return {
    page: page.value,
    pageSize: pageSize.value as 10 | 20 | 50 | 100 | 200,
    recipientPhone: recipientPhone.value,
    senderPhone: senderPhone.value,
    sortField: "visitCount" as const,
    sortOrder: sortOrder.value
  };
}

async function load(): Promise<void> {
  const sequence = ++requestSequence;
  loading.value = true;
  try {
    const result = await getHyperlinkAttribution(props.taskId, query());
    if (sequence !== requestSequence) return;
    rows.value = result.list;
    total.value = result.total;
    errorMessage.value = "";
  } catch (error) {
    if (sequence !== requestSequence) return;
    rows.value = [];
    total.value = 0;
    errorMessage.value = apiErrorMessage(error, "深度归因加载失败");
  } finally {
    if (sequence === requestSequence) loading.value = false;
  }
}

function search(): void {
  page.value = 1;
  void load();
}

function reset(): void {
  recipientPhone.value = "";
  senderPhone.value = "";
  sortOrder.value = "desc";
  search();
}

function onSort(input: { prop?: string; order?: string | null }): void {
  sortOrder.value = input.order === "ascending" ? "asc" : "desc";
  search();
}

async function exportCsv(): Promise<void> {
  exporting.value = true;
  exportAbort = new AbortController();
  try {
    const created = await exportHyperlinkAttribution(props.taskId, query());
    const completed = await waitForHyperlinkTaskExport(
      created,
      exportAbort.signal
    );
    const file = await downloadHyperlinkTaskExport(completed);
    downloadBlobFile(file.filename, file.blob);
    ElMessage.success(`归因明细已导出，共 ${completed.rowCount} 行`);
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "归因明细导出失败"));
  } finally {
    exportAbort = undefined;
    exporting.value = false;
  }
}
</script>

<template>
  <section class="attribution-tab">
    <el-alert
      v-if="errorMessage"
      type="error"
      show-icon
      :closable="false"
      :title="errorMessage"
    >
      <el-button link type="primary" @click="load">重试</el-button>
    </el-alert>

    <el-form class="filters" inline @submit.prevent="search">
      <el-form-item label="收件号码">
        <el-input
          v-model="recipientPhone"
          clearable
          placeholder="输入收件号码"
          @keyup.enter="search"
        />
      </el-form-item>
      <el-form-item label="发信账号">
        <el-input
          v-model="senderPhone"
          clearable
          placeholder="输入发信账号"
          @keyup.enter="search"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="search">搜索</el-button>
        <el-button @click="reset">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="metrics">
      点击总数 <strong>{{ total }}</strong>
      <el-divider direction="vertical" />
      单钩数 <strong>{{ successNum }}</strong>
      <el-divider direction="vertical" />
      点击率 <strong>{{ clickRate }}</strong>
    </div>

    <PureTableBar title="深度归因" :columns="columns" @refresh="load">
      <template #buttons>
        <el-button
          v-if="canSensitiveExport"
          :loading="exporting"
          @click="exportCsv"
          >导出</el-button
        >
      </template>
      <template #default="{ dynamicColumns }">
        <el-table
          v-loading="loading"
          :data="rows"
          row-key="id"
          border
          size="small"
          height="calc(100vh - 410px)"
          @sort-change="onSort"
        >
          <el-table-column
            v-if="!dynamicColumns[0].hide"
            prop="recipientPhone"
            label="收件人手机号"
            width="150"
          />
          <el-table-column
            v-if="!dynamicColumns[1].hide"
            prop="senderPhone"
            label="发送账号"
            width="150"
          />
          <el-table-column
            v-if="!dynamicColumns[2].hide"
            prop="visitCount"
            label="访问次数"
            width="110"
            sortable="custom"
          >
            <template #default="{ row }"
              ><el-tag round>{{ row.visitCount }}</el-tag></template
            >
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[3].hide"
            prop="countryIso2"
            label="国家/地区"
            width="110"
          />
          <el-table-column
            v-if="!dynamicColumns[4].hide"
            prop="device"
            label="设备"
            width="100"
          />
          <el-table-column
            v-if="!dynamicColumns[5].hide"
            prop="os"
            label="操作系统"
            width="120"
          />
          <el-table-column
            v-if="!dynamicColumns[6].hide"
            prop="browser"
            label="浏览器"
            width="130"
          />
          <el-table-column
            v-if="!dynamicColumns[7].hide"
            prop="language"
            label="语言"
            width="90"
          />
          <el-table-column
            v-if="!dynamicColumns[8].hide"
            label="IP"
            width="140"
          >
            <template #default="{ row }">
              <AttributionIpCell
                :ip="row.ip"
                :user-agent="row.userAgent"
                :purged="row.attributionPurged"
                :masked-fields="row.maskedFields"
              />
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[9].hide"
            label="首次访问"
            width="170"
          >
            <template #default="{ row }">{{
              formatHyperlinkTime(row.firstVisitAt)
            }}</template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[10].hide"
            label="最近访问"
            width="170"
          >
            <template #default="{ row }">{{
              formatHyperlinkTime(row.lastVisitAt)
            }}</template>
          </el-table-column>
          <template #empty>暂无点击归因数据</template>
        </el-table>
        <WheelPagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100, 200]"
          :total="total"
          @change="load"
        />
      </template>
    </PureTableBar>
  </section>
</template>

<style scoped>
.attribution-tab {
  min-width: 0;
}

.filters {
  margin: 12px 10px 0;
}

.filters :deep(.el-input) {
  width: 220px;
}

.metrics {
  padding: 10px 14px;
  margin: 0 10px 4px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.metrics strong {
  color: var(--el-color-primary);
}

:deep(.el-table__inner-wrapper) {
  min-width: 1480px;
}
</style>
