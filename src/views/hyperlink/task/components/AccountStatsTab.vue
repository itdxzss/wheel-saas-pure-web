<script setup lang="ts">
import { computed, nextTick, ref, toRef } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import WheelPagination from "@/components/WheelPagination/index.vue";
import type { IpCountryOption } from "@/api/resource-ip";
import type { HyperlinkAccountStatItem } from "@/api/hyperlink-task-account-stats";
import { formatEpochMillis } from "@/utils/time";
import { useAccountStatQuery } from "../composables/useAccountStatQuery";
import AccountStatAccountCell from "./AccountStatAccountCell.vue";
import Download from "~icons/ep/download";
import RefreshRight from "~icons/ep/refresh-right";
import Search from "~icons/ri/search-line";

defineOptions({ name: "AccountStatsTab" });

const props = withDefaults(
  defineProps<{
    taskId: number | null;
    active?: boolean;
    countryOptions?: IpCountryOption[];
  }>(),
  {
    active: true,
    countryOptions: () => []
  }
);

const emit = defineEmits<{
  (event: "refresh-summary"): void;
}>();

const tableRef = ref();
let suppressSortChange = false;
const columns: TableColumnList = [
  { label: "发送账号", prop: "senderPhone", minWidth: 190 },
  { label: "国家", prop: "senderCountryIso2", width: 110 },
  { label: "账号类型", prop: "accountType", width: 110 },
  { label: "存活天数", prop: "retentionDays", width: 120 },
  { label: "单钩数", prop: "successNum", width: 110 },
  { label: "双钩数", prop: "deliveredNum", width: 110 },
  { label: "失败数", prop: "failedNum", width: 110 },
  { label: "最后发送时间", prop: "lastSendAt", width: 190 }
];

const {
  errorMessage,
  exporting,
  loading,
  page,
  pageSize,
  rows,
  searchForm,
  sortField,
  sortOrder,
  total,
  exportCurrent,
  load,
  onSortChange,
  refresh,
  reset,
  search
} = useAccountStatQuery(toRef(props, "taskId"), toRef(props, "active"), () =>
  emit("refresh-summary")
);

const pickerRange = computed<Date[] | []>({
  get: () =>
    searchForm.timeRange.length === 2
      ? [new Date(searchForm.timeRange[0]), new Date(searchForm.timeRange[1])]
      : [],
  set: value => {
    searchForm.timeRange =
      value.length === 2 ? [value[0].getTime(), value[1].getTime()] : [];
  }
});

const defaultSort = computed(() => ({
  prop: sortField.value,
  order: (sortOrder.value === "asc" ? "ascending" : "descending") as
    | "ascending"
    | "descending"
}));

function asRow(value: unknown): HyperlinkAccountStatItem {
  return value as HyperlinkAccountStatItem;
}

function countryLabel(iso2: string | null): string {
  if (!iso2) return "-";
  const option = props.countryOptions.find(item => item.iso2 === iso2);
  return option
    ? `${option.flag || ""} ${option.nameZh} (${iso2})`.trim()
    : iso2;
}

function accountTypeLabel(value: string | null): string {
  if (value === "PERSONAL") return "个人号";
  if (value === "BUSINESS") return "商业号";
  return "-";
}

function accountTypeTag(value: string | null): "success" | "info" {
  return value === "BUSINESS" ? "success" : "info";
}

async function resetFilters(): Promise<void> {
  suppressSortChange = true;
  tableRef.value?.clearSort?.();
  await nextTick();
  suppressSortChange = false;
  await reset();
}

async function handleSortChange(event: {
  prop?: string | null;
  order?: string | null;
}): Promise<void> {
  if (suppressSortChange) return;
  await onSortChange(event);
}

function rowKey(row: HyperlinkAccountStatItem): string {
  return String(row.bucketKey);
}

defineExpose({ refresh });
</script>

<template>
  <section class="account-stats-tab">
    <el-form :inline="true" class="account-stats-filter" label-position="left">
      <el-form-item label="发送时间">
        <el-date-picker
          v-model="pickerRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          :clearable="true"
          @change="search"
        />
      </el-form-item>

      <el-form-item label="发信国家">
        <el-select
          v-model="searchForm.senderCountryIso2"
          clearable
          filterable
          placeholder="全部国家"
          class="country-select"
          @keyup.enter="search"
        >
          <el-option label="未知国家" value="UNKNOWN" />
          <el-option
            v-for="country in countryOptions"
            :key="country.iso2 || country.value"
            :label="
              `${country.flag || ''} ${country.nameZh} ${country.phonePrefix || ''}`.trim()
            "
            :value="country.iso2 || country.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="成功率">
        <div class="rate-range">
          <el-input-number
            v-model="searchForm.successRateMin"
            :min="0"
            :max="100"
            :precision="1"
            :controls="false"
            placeholder="最小 %"
            @keyup.enter="search"
          />
          <span>~</span>
          <el-input-number
            v-model="searchForm.successRateMax"
            :min="0"
            :max="100"
            :precision="1"
            :controls="false"
            placeholder="最大 %"
            @keyup.enter="search"
          />
        </div>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :icon="useRenderIcon(Search)" @click="search">
          搜索
        </el-button>
        <el-button :icon="useRenderIcon(RefreshRight)" @click="resetFilters">
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <el-alert
      v-if="errorMessage"
      class="account-stats-error"
      type="error"
      show-icon
      :closable="false"
      :title="errorMessage"
    >
      <el-button link type="primary" @click="load">重试</el-button>
    </el-alert>

    <PureTableBar
      title="发信账号维度统计"
      :columns="columns"
      table-key="hyperlink-account-stats"
      @refresh="refresh"
    >
      <template #buttons>
        <el-button
          v-auth="'tenant:hyperlink_task:export'"
          plain
          :loading="exporting"
          :icon="useRenderIcon(Download)"
          @click="exportCurrent"
        >
          导出
        </el-button>
      </template>

      <template #default="{ size, dynamicColumns }">
        <el-table
          ref="tableRef"
          v-loading="loading"
          :data="rows"
          :row-key="rowKey"
          :size="size"
          :default-sort="defaultSort"
          border
          @sort-change="handleSortChange"
        >
          <el-table-column
            v-if="!dynamicColumns[0].hide"
            label="发送账号"
            min-width="190"
          >
            <template #default="{ row }">
              <AccountStatAccountCell :row="asRow(row)" />
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[1].hide"
            prop="senderCountryIso2"
            label="国家"
            min-width="150"
          >
            <template #default="{ row }">
              {{ countryLabel(asRow(row).senderCountryIso2) }}
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[2].hide"
            prop="accountType"
            label="账号类型"
            width="110"
          >
            <template #default="{ row }">
              <el-tag
                v-if="asRow(row).accountType"
                size="small"
                :type="accountTypeTag(asRow(row).accountType)"
              >
                {{ accountTypeLabel(asRow(row).accountType) }}
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[3].hide"
            prop="retentionDays"
            label="存活天数"
            width="120"
            align="right"
          >
            <template #default="{ row }">
              {{ asRow(row).retentionDays.toFixed(1) }} 天
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[4].hide"
            prop="successNum"
            label="单钩数"
            width="110"
            align="right"
            sortable="custom"
          />
          <el-table-column
            v-if="!dynamicColumns[5].hide"
            prop="deliveredNum"
            label="双钩数"
            width="110"
            align="right"
            sortable="custom"
          />
          <el-table-column
            v-if="!dynamicColumns[6].hide"
            prop="failedNum"
            label="失败数"
            width="110"
            align="right"
            sortable="custom"
          />
          <el-table-column
            v-if="!dynamicColumns[7].hide"
            prop="lastSendAt"
            label="最后发送时间"
            width="190"
          >
            <template #default="{ row }">
              {{ formatEpochMillis(asRow(row).lastSendAt) }}
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无符合条件的发信账号统计" />
          </template>
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
.account-stats-tab {
  min-width: 0;
}

.account-stats-filter {
  padding: 16px 16px 0;
  margin-bottom: 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.country-select {
  width: 210px;
}

.rate-range {
  display: flex;
  gap: 8px;
  align-items: center;
}

.rate-range :deep(.el-input-number) {
  width: 108px;
}

.account-stats-error {
  margin-bottom: 12px;
}
</style>
