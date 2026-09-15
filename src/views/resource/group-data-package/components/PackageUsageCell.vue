<script setup lang="ts">
import { computed } from "vue";
import type { GroupDataPackageMetrics } from "@/api/group-data-package";
defineOptions({ name: "GroupPackageUsageCell" });
const props = defineProps<{ metrics: GroupDataPackageMetrics }>();
const used = computed(() =>
  Math.max(0, props.metrics.totalCount - props.metrics.unusedCount)
);
const privacyRate = computed(() =>
  props.metrics.totalCount > 0
    ? `${((props.metrics.privacyRejectedCount * 100) / props.metrics.totalCount).toFixed(1)}%`
    : "—"
);
const segments = computed(() => {
  const m = props.metrics;
  return [
    {
      key: "unused",
      label: "未使用",
      count: m.unusedCount,
      color: "var(--el-color-info)"
    },
    {
      key: "success",
      label: "成功",
      count: m.successCount,
      color: "var(--el-color-success)"
    },
    {
      key: "claimed",
      label: "已领取",
      count: m.claimedCount,
      color: "var(--el-color-primary)"
    },
    {
      key: "failed",
      label: "失败",
      count: m.failedCount,
      color: "var(--el-color-danger)"
    },
    {
      key: "unknown",
      label: "待确认",
      count: m.unknownCount,
      color: "var(--el-color-warning)"
    }
  ].filter(item => item.count > 0);
});
</script>

<template>
  <div class="usage-cell">
    <div class="usage-total">
      <strong>{{ metrics.totalCount.toLocaleString() }}</strong
      ><span>隐私拒绝 {{ privacyRate }}</span>
    </div>
    <div
      class="usage-bar"
      :aria-label="
        segments.map(item => `${item.label} ${item.count}`).join('，')
      "
      role="img"
    >
      <span
        v-for="item in segments"
        :key="item.key"
        :title="`${item.label} ${item.count}`"
        :style="{ flexGrow: item.count, background: item.color }"
      />
    </div>
    <div class="usage-line">
      <span
        >未用 <b>{{ metrics.unusedCount.toLocaleString() }}</b></span
      ><span
        >已使用 <b>{{ used.toLocaleString() }}</b></span
      ><span class="failure"
        >失败 <b>{{ metrics.failedCount.toLocaleString() }}</b></span
      >
    </div>
    <div class="usage-detail">
      成功 {{ metrics.successCount.toLocaleString() }} · 已领取
      {{ metrics.claimedCount.toLocaleString() }} · 待确认
      {{ metrics.unknownCount.toLocaleString() }}
    </div>
  </div>
</template>

<style scoped>
.usage-cell {
  padding: 5px 0;
  font-size: 12px;
}

.usage-total,
.usage-line {
  display: flex;
  gap: 8px;
  justify-content: space-between;
}

.usage-total strong {
  font-size: 16px;
}

.usage-total span,
.usage-detail {
  color: var(--el-text-color-secondary);
}

.usage-bar {
  display: flex;
  height: 5px;
  margin: 7px 0;
  overflow: hidden;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.usage-bar span {
  flex-basis: 0;
}

.failure {
  color: var(--el-color-danger);
}

.usage-detail {
  margin-top: 4px;
  font-size: 11px;
}
</style>
