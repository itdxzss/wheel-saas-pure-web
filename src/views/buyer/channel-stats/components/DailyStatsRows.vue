<script setup lang="ts">
import type { BuyerChannelStatsDailyRow } from "@/api/buyer-channel-stats";
import {
  deriveChannelStats,
  formatDuration,
  formatNumber,
  formatRatio
} from "../domain/stats-format";

defineProps<{
  rows: BuyerChannelStatsDailyRow[];
  loading: boolean;
  savingDate?: string;
}>();

const emit = defineEmits<{
  save: [row: BuyerChannelStatsDailyRow];
}>();

function derived(row: BuyerChannelStatsDailyRow) {
  return deriveChannelStats(row);
}
</script>

<template>
  <div class="daily-stats">
    <div class="daily-title">日明细补录</div>
    <el-table v-loading="loading" :data="rows" size="small" border>
      <el-table-column label="日期" prop="date" fixed min-width="110" />
      <el-table-column label="消耗" min-width="130">
        <template #default="{ row }">
          <el-input-number v-model="row.spend" :min="0" :precision="2" />
        </template>
      </el-table-column>
      <el-table-column label="展示" min-width="130">
        <template #default="{ row }">
          <el-input-number v-model="row.impressions" :min="0" :precision="0" />
        </template>
      </el-table-column>
      <el-table-column label="点击" min-width="130">
        <template #default="{ row }">
          <el-input-number v-model="row.clicks" :min="0" :precision="0" />
        </template>
      </el-table-column>
      <el-table-column label="手续费率" min-width="140">
        <template #default="{ row }">
          <el-input-number
            v-model="row.serviceRate"
            :min="0"
            :precision="4"
            :step="0.01"
          />
        </template>
      </el-table-column>
      <el-table-column label="其他费用" min-width="130">
        <template #default="{ row }">
          <el-input-number v-model="row.otherFee" :min="0" :precision="2" />
        </template>
      </el-table-column>
      <el-table-column label="总费用/手续费" min-width="150">
        <template #default="{ row }">
          {{ formatNumber(derived(row).totalFee) }} /
          {{ formatNumber(derived(row).serviceFee) }}
        </template>
      </el-table-column>
      <el-table-column label="UV" prop="uv" min-width="80" />
      <el-table-column label="访问时长" min-width="110">
        <template #default="{ row }">
          {{ formatDuration(row.visitDurationSeconds) }}
        </template>
      </el-table-column>
      <el-table-column label="访客上号率" min-width="110">
        <template #default="{ row }">
          {{ formatRatio(derived(row).visitorConversionRate) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="100">
        <template #default="{ row }">
          <el-button
            v-auth="'tenant:buyer-channel-stats:edit'"
            link
            type="primary"
            :loading="savingDate === row.date"
            @click="emit('save', row)"
          >
            保存
          </el-button>
        </template>
      </el-table-column>
      <template #empty><el-empty description="暂无日明细" /></template>
    </el-table>
  </div>
</template>

<style scoped>
.daily-stats {
  padding: 12px 18px 18px;
  background: var(--el-fill-color-light);
}

.daily-title {
  margin-bottom: 10px;
  font-weight: 600;
}

:deep(.el-input-number) {
  width: 112px;
}
</style>
