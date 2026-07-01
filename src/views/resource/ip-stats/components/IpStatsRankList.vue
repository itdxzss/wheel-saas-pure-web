<script setup lang="ts">
import type { IpCountryStatsRow } from "@/api/resource-ip-stats";
import ArrowDown from "~icons/ep/arrow-down";
import ArrowUp from "~icons/ep/arrow-up";
import { useIpStatsRankCollapse } from "../composables/useIpStatsRankCollapse";

defineOptions({
  name: "IpStatsRankList"
});

defineProps<{
  loading: boolean;
  rankBarWidth: (row: IpCountryStatsRow) => string;
  rows: IpCountryStatsRow[];
}>();

const {
  rankAriaExpanded,
  rankCollapsed,
  rankCollapseText,
  toggleRankCollapse
} = useIpStatsRankCollapse();
</script>

<template>
  <el-card class="ip-stats-rank-card" shadow="never">
    <template #header>
      <div class="ip-stats-rank-head">
        <div>
          <strong>国家 IP 数量排行 Top 10</strong>
          <span>按 IP 总数倒序展示，包含使用中、空闲和不可用</span>
        </div>
        <el-button
          size="small"
          :icon="rankCollapsed ? ArrowDown : ArrowUp"
          :aria-expanded="rankAriaExpanded"
          @click="toggleRankCollapse"
        >
          {{ rankCollapseText }}
        </el-button>
      </div>
    </template>
    <div v-show="!rankCollapsed" v-loading="loading" class="ip-stats-rank-list">
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

.ip-stats-rank-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.ip-stats-rank-head span {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
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
  .ip-stats-rank-head {
    align-items: stretch;
  }

  .ip-stats-rank-row {
    grid-template-columns: 1fr;
  }
}
</style>
