<script setup lang="ts">
import type {
  BuyerChannelStatsDailyRow,
  BuyerChannelStatsRow,
  BuyerChannelStatsSortField,
  BuyerChannelStatsSortOrder
} from "@/api/buyer-channel-stats";
import type { DailyStatsPanel } from "../composables/useDailyStatsPanels";
import {
  deriveChannelStats,
  formatDuration,
  formatNumber,
  formatRatio
} from "../domain/stats-format";
import DailyStatsRows from "./DailyStatsRows.vue";

const props = defineProps<{
  rows: BuyerChannelStatsRow[];
  loading: boolean;
  panelFor: (channelId: number, countryCode: string) => DailyStatsPanel;
}>();

const emit = defineEmits<{
  expand: [row: BuyerChannelStatsRow];
  save: [summary: BuyerChannelStatsRow, daily: BuyerChannelStatsDailyRow];
  sort: [
    field?: BuyerChannelStatsSortField,
    order?: BuyerChannelStatsSortOrder
  ];
}>();

function countryCode(row: BuyerChannelStatsRow): string {
  return row.countryCode ?? "";
}

function derived(row: BuyerChannelStatsRow) {
  return { ...deriveChannelStats(row), ...row };
}

function onExpandChange(row: BuyerChannelStatsRow, expanded: boolean): void {
  if (expanded) emit("expand", row);
}

function onSortChange(input: {
  prop?: BuyerChannelStatsSortField;
  order?: "ascending" | "descending" | null;
}): void {
  emit(
    "sort",
    input.prop,
    input.order === "ascending"
      ? "asc"
      : input.order === "descending"
        ? "desc"
        : undefined
  );
}
</script>

<template>
  <el-table
    v-loading="loading"
    :data="rows"
    :row-key="row => `${row.channelId}:${row.countryCode}`"
    border
    @expand-change="onExpandChange"
    @sort-change="onSortChange"
  >
    <el-table-column type="expand" fixed width="52">
      <template #default="{ row }">
        <DailyStatsRows
          :rows="props.panelFor(row.channelId, countryCode(row)).rows"
          :loading="props.panelFor(row.channelId, countryCode(row)).loading"
          :saving-date="
            props.panelFor(row.channelId, countryCode(row)).savingDate
          "
          @save="emit('save', row, $event)"
        />
      </template>
    </el-table-column>
    <el-table-column label="渠道/国家" fixed min-width="180">
      <template #default="{ row }">
        <div>{{ row.channelName || row.channelCode || row.channelId }}</div>
        <small>{{ row.countryName || row.countryCode }}</small>
      </template>
    </el-table-column>
    <el-table-column
      label="绑定模板"
      prop="templateName"
      fixed
      min-width="150"
    />
    <el-table-column label="广告投放">
      <el-table-column
        label="消耗"
        prop="spend"
        sortable="custom"
        min-width="105"
      >
        <template #default="{ row }">{{ formatNumber(row.spend) }}</template>
      </el-table-column>
      <el-table-column
        label="展示"
        prop="impressions"
        sortable="custom"
        min-width="100"
      />
      <el-table-column
        label="点击/点击率"
        prop="clicks"
        sortable="custom"
        min-width="135"
      >
        <template #default="{ row }">
          {{ row.clicks }} / {{ formatRatio(derived(row).clickRate) }}
        </template>
      </el-table-column>
      <el-table-column label="其他费用" prop="otherFee" min-width="105">
        <template #default="{ row }">{{ formatNumber(row.otherFee) }}</template>
      </el-table-column>
      <el-table-column
        label="总费用/手续费"
        prop="totalFee"
        sortable="custom"
        min-width="150"
      >
        <template #default="{ row }">
          {{ formatNumber(derived(row).totalFee) }} /
          {{ formatNumber(derived(row).serviceFee) }}
        </template>
      </el-table-column>
    </el-table-column>
    <el-table-column label="基础指标">
      <el-table-column label="UV" prop="uv" sortable="custom" min-width="90" />
      <el-table-column
        label="访问时长"
        prop="visitDurationSeconds"
        min-width="110"
      >
        <template #default="{ row }">{{
          formatDuration(row.visitDurationSeconds)
        }}</template>
      </el-table-column>
      <el-table-column label="登录请求次数/去重人数" min-width="180">
        <template #default="{ row }"
          >{{ row.loginRequestCount }} /
          {{ row.loginRequestUserCount }}</template
        >
      </el-table-column>
      <el-table-column
        label="登录成功次数/去重人数"
        prop="loginSuccessUserCount"
        sortable="custom"
        min-width="180"
      >
        <template #default="{ row }"
          >{{ row.loginSuccessCount }} /
          {{ row.loginSuccessUserCount }}</template
        >
      </el-table-column>
      <el-table-column label="解绑数量" prop="unbindCount" min-width="100" />
      <el-table-column
        label="解绑率"
        prop="unbindRate"
        sortable="custom"
        min-width="100"
      >
        <template #default="{ row }">{{
          formatRatio(derived(row).unbindRate)
        }}</template>
      </el-table-column>
      <el-table-column label="请求登录率" min-width="110">
        <template #default="{ row }">{{
          formatRatio(derived(row).loginRequestRate)
        }}</template>
      </el-table-column>
      <el-table-column label="登录成功率" min-width="110">
        <template #default="{ row }">{{
          formatRatio(derived(row).loginSuccessRate)
        }}</template>
      </el-table-column>
      <el-table-column label="访客上号率" min-width="110">
        <template #default="{ row }">{{
          formatRatio(derived(row).visitorConversionRate)
        }}</template>
      </el-table-column>
      <el-table-column
        label="获号成本"
        prop="accountCost"
        sortable="custom"
        min-width="105"
      >
        <template #default="{ row }">{{
          formatNumber(derived(row).accountCost)
        }}</template>
      </el-table-column>
    </el-table-column>
    <template #empty><el-empty description="暂无渠道统计" /></template>
  </el-table>
</template>
