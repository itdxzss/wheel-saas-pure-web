<script setup lang="ts">
import { computed } from "vue";
import type { DataPackageListItem } from "@/api/hyperlink-data-package";

defineOptions({ name: "DataPackageUsageCell" });

const props = defineProps<{ row: DataPackageListItem }>();

const total = computed(() => Math.max(0, props.row.metrics.totalCount));
const percent = (value: number): number =>
  total.value > 0 ? Math.min(100, (Math.max(0, value) * 100) / total.value) : 0;
const successfulUsed = computed(() =>
  Math.max(0, props.row.metrics.usedCount - props.row.metrics.failedCount)
);
</script>

<template>
  <div class="usage-cell">
    <div class="usage-heading">
      <div class="usage-total">
        {{ row.metrics.totalCount.toLocaleString() }} <span>条</span>
      </div>
      <div class="unopened-ratio">
        未开通比例
        <b>{{ percent(row.metrics.unregisteredCount).toFixed(1) }}%</b>
      </div>
    </div>
    <div class="usage-bar">
      <span
        class="usage-bar-segment usage-bar-segment--unused"
        :style="{ flexBasis: `${percent(row.metrics.unusedCount)}%` }"
      />
      <span
        class="usage-bar-segment usage-bar-segment--successful"
        :style="{ flexBasis: `${percent(successfulUsed)}%` }"
      />
      <span
        class="usage-bar-segment usage-bar-segment--failed"
        :style="{ flexBasis: `${percent(row.metrics.failedCount)}%` }"
      />
    </div>
    <div class="usage-breakdown">
      <span
        ><i class="dot dot-unused" />未用
        {{ row.metrics.unusedCount.toLocaleString() }}</span
      >
      <span
        ><i class="dot dot-used" />已使用
        {{ row.metrics.usedCount.toLocaleString() }}</span
      >
      <span class="failure-line">
        <i class="dot dot-failed" />失败
        {{ row.metrics.failedCount.toLocaleString() }}
        <small
          >（未开通 WS
          {{ row.metrics.unregisteredCount.toLocaleString() }}）</small
        >
      </span>
    </div>
  </div>
</template>

<style scoped>
.usage-cell {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.usage-heading,
.usage-breakdown {
  display: flex;
  align-items: center;
}

.usage-heading {
  gap: 8px;
  justify-content: space-between;
}

.usage-total {
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
}

.usage-total span,
.usage-breakdown,
.failure-line small,
.unopened-ratio {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.unopened-ratio b {
  margin-left: 3px;
  color: var(--el-color-danger);
}

.usage-bar {
  display: flex;
  width: 100%;
  height: 8px;
  overflow: hidden;
  background: var(--el-fill-color);
  border-radius: 5px;
}

.usage-bar-segment {
  display: block;
  flex: 0 0 auto;
  height: 100%;
}

.usage-bar-segment--unused {
  background-color: var(--el-color-info-light-5);
}

.usage-bar-segment--successful {
  background-color: var(--el-color-success);
}

.usage-bar-segment--failed {
  background-color: var(--el-color-danger, #f56c6c);
}

.usage-breakdown {
  flex-wrap: wrap;
  gap: 6px 10px;
}

.failure-line {
  width: 100%;
}

.dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 4px;
  border-radius: 50%;
}

.dot-unused {
  background: var(--el-color-info-light-5);
}

.dot-used {
  background: var(--el-color-success);
}

.dot-failed {
  background: var(--el-color-danger);
}
</style>
