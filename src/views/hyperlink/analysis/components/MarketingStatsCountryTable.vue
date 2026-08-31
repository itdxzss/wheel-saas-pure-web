<script setup lang="ts">
import type {
  HyperlinkMarketingCountryPair,
  HyperlinkMarketingMetric
} from "@/api/hyperlink-analysis";
import {
  formatMarketingAverage,
  formatMarketingCount,
  formatMarketingRate,
  marketingCountryFlag,
  marketingCountryLabel
} from "../domain/marketing-stats";

defineProps<{
  items: HyperlinkMarketingCountryPair[];
  loading: boolean;
}>();

function pairKey(row: HyperlinkMarketingCountryPair): string {
  return `${row.senderCountryIso2}-${row.recipientCountryIso2}`;
}

function clickRate(metric: HyperlinkMarketingMetric): number {
  return metric.successNum > 0 ? metric.clickUvNum / metric.successNum : 0;
}
</script>

<template>
  <el-table
    v-loading="loading"
    :data="items"
    :row-key="pairKey"
    stripe
    class="country-pair-table"
  >
    <el-table-column type="expand" width="46">
      <template #default="{ row }">
        <div class="series-table-wrap">
          <p>该国家对按时间分桶明细</p>
          <el-table :data="row.series" size="small" border>
            <el-table-column prop="statTime" label="统计时间" min-width="150" />
            <el-table-column label="发送量" min-width="100" align="right">
              <template #default="scope">
                {{ formatMarketingCount(scope.row.sendTotal) }}
              </template>
            </el-table-column>
            <el-table-column
              label="单钩 / 单钩率"
              min-width="150"
              align="right"
            >
              <template #default="scope">
                {{ formatMarketingCount(scope.row.successNum) }}
                <small>{{
                  formatMarketingRate(scope.row.sendSuccessRate)
                }}</small>
              </template>
            </el-table-column>
            <el-table-column
              label="点击 UV / 访问率"
              min-width="150"
              align="right"
            >
              <template #default="scope">
                {{ formatMarketingCount(scope.row.clickUvNum) }}
                <small>{{ formatMarketingRate(clickRate(scope.row)) }}</small>
              </template>
            </el-table-column>
            <el-table-column
              label="双钩 / 双钩率"
              min-width="150"
              align="right"
            >
              <template #default="scope">
                {{ formatMarketingCount(scope.row.deliveredNum) }}
                <small>{{ formatMarketingRate(scope.row.deliveryRate) }}</small>
              </template>
            </el-table-column>
            <el-table-column label="使用号数" min-width="105" align="right">
              <template #default="scope">
                {{ formatMarketingCount(scope.row.usedAccountCount) }}
              </template>
            </el-table-column>
            <el-table-column label="号均" min-width="85" align="right">
              <template #default="scope">
                {{ formatMarketingAverage(scope.row.avgSendPerAccount) }}
              </template>
            </el-table-column>
            <el-table-column
              label="封号 / 封号率"
              min-width="145"
              align="right"
            >
              <template #default="scope">
                {{ formatMarketingCount(scope.row.bannedAccountCount) }}
                <small>{{
                  formatMarketingRate(scope.row.marketingBanRate)
                }}</small>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>
    </el-table-column>

    <el-table-column
      label="国家对（发信 → 被营销）"
      min-width="220"
      fixed="left"
    >
      <template #default="{ row }">
        <div class="country-pair">
          <span>{{ marketingCountryFlag(row.senderCountryIso2) }}</span>
          <b>{{ marketingCountryLabel(row.senderCountryIso2) }}</b>
          <i>→</i>
          <span>{{ marketingCountryFlag(row.recipientCountryIso2) }}</span>
          <b>{{ marketingCountryLabel(row.recipientCountryIso2) }}</b>
        </div>
      </template>
    </el-table-column>
    <el-table-column label="发送量" min-width="105" align="right" sortable>
      <template #default="{ row }">
        {{ formatMarketingCount(row.summary.sendTotal) }}
      </template>
    </el-table-column>
    <el-table-column label="单钩 / 单钩率" min-width="145" align="right">
      <template #default="{ row }">
        {{ formatMarketingCount(row.summary.successNum) }}
        <small>{{ formatMarketingRate(row.summary.sendSuccessRate) }}</small>
      </template>
    </el-table-column>
    <el-table-column label="点击 UV / 访问率" min-width="150" align="right">
      <template #default="{ row }">
        {{ formatMarketingCount(row.summary.clickUvNum) }}
        <small>{{ formatMarketingRate(clickRate(row.summary)) }}</small>
      </template>
    </el-table-column>
    <el-table-column label="双钩 / 双钩率" min-width="145" align="right">
      <template #default="{ row }">
        {{ formatMarketingCount(row.summary.deliveredNum) }}
        <small>{{ formatMarketingRate(row.summary.deliveryRate) }}</small>
      </template>
    </el-table-column>
    <el-table-column label="使用号数" min-width="105" align="right">
      <template #default="{ row }">
        {{ formatMarketingCount(row.summary.usedAccountCount) }}
      </template>
    </el-table-column>
    <el-table-column label="号均" min-width="85" align="right">
      <template #default="{ row }">
        {{ formatMarketingAverage(row.summary.avgSendPerAccount) }}
      </template>
    </el-table-column>
    <el-table-column label="封号 / 封号率" min-width="145" align="right">
      <template #default="{ row }">
        {{ formatMarketingCount(row.summary.bannedAccountCount) }}
        <small>{{ formatMarketingRate(row.summary.marketingBanRate) }}</small>
      </template>
    </el-table-column>
    <template #empty>
      <el-empty description="当前筛选下暂无市场分析数据" />
    </template>
  </el-table>
</template>

<style scoped>
.country-pair-table {
  width: 100%;
}

.country-pair {
  display: flex;
  gap: 6px;
  align-items: center;
}

.country-pair i {
  margin: 0 3px;
  font-style: normal;
  color: var(--el-text-color-placeholder);
}

small {
  margin-left: 5px;
  color: var(--el-text-color-secondary);
}

.series-table-wrap {
  padding: 4px 18px 16px 48px;
  background: var(--el-fill-color-lighter);
}

.series-table-wrap p {
  margin: 8px 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
