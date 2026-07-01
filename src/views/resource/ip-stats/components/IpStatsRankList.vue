<script setup lang="ts">
import type { IpCountryStatsRow } from "@/api/resource-ip-stats";

defineOptions({
  name: "IpStatsRankList"
});

defineProps<{
  loading: boolean;
  rankBarWidth: (row: IpCountryStatsRow) => string;
  rows: IpCountryStatsRow[];
}>();
</script>

<template>
  <el-card class="ip-stats-rank-card" shadow="never">
    <template #header>
      <strong>国家 IP 数量排行 Top 10</strong>
    </template>
    <div v-loading="loading" class="ip-stats-rank-list">
      <div v-if="rows.length === 0" class="ip-stats-inline-empty">
        暂无 IP 数据
      </div>
      <div v-for="row in rows" :key="row.region" class="ip-stats-rank-row">
        <div class="ip-stats-rank-country">
          <b>{{ row.region }}</b>
          <span>
            使用中 {{ row.inUseIpCount }} / 空闲 {{ row.idleIpCount }} / 不可用
            {{ row.unavailableIpCount }}
          </span>
        </div>
        <div class="ip-stats-rank-bar">
          <i :style="{ width: rankBarWidth(row) }" />
        </div>
        <strong>{{ row.totalIpCount }}</strong>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.ip-stats-rank-card {
  margin-bottom: 12px;
}

.ip-stats-rank-list {
  display: grid;
  gap: 10px;
  min-height: 80px;
}

.ip-stats-rank-row {
  display: grid;
  grid-template-columns: minmax(180px, 260px) 1fr 64px;
  gap: 12px;
  align-items: center;
}

.ip-stats-rank-country {
  display: grid;
  gap: 3px;
}

.ip-stats-rank-country span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ip-stats-rank-bar {
  height: 8px;
  overflow: hidden;
  background: var(--el-fill-color-light);
  border-radius: 999px;
}

.ip-stats-rank-bar i {
  display: block;
  height: 100%;
  background: var(--el-color-primary);
  border-radius: inherit;
}

.ip-stats-inline-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 768px) {
  .ip-stats-rank-row {
    grid-template-columns: 1fr;
  }
}
</style>
