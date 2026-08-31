<script setup lang="ts">
import { computed } from "vue";
import type { HyperlinkTaskListItem } from "@/api/hyperlink-task-list";
import { currentPageMetrics } from "../domain/list-display";

const props = defineProps<{ rows: HyperlinkTaskListItem[] }>();
const metrics = computed(() => currentPageMetrics(props.rows));
</script>

<template>
  <div class="metrics-section">
    <div class="metrics-row">
      <span class="summary-label">◔ 当前条件汇总</span>
      <i aria-hidden="true" />
      <span
        >任务数 <strong>{{ metrics.taskCount }}</strong></span
      >
      <span
        >发送总数
        <strong>{{ metrics.recipientTotal.toLocaleString() }}</strong></span
      >
      <span class="single-hook"
        >✓ 单钩数
        <strong>{{ metrics.successNum.toLocaleString() }}</strong></span
      >
      <span class="double-hook"
        >✓✓ 双钩数 <strong>{{ metrics.deliveredNum.toLocaleString() }}</strong>
        <small>({{ metrics.deliveryRate }})</small></span
      >
      <span class="click-metric"
        >◎ 点击 UV
        <strong>{{ metrics.clickUvNum.toLocaleString() }}</strong></span
      >
      <span
        >点击率
        <strong class="click-rate">{{ metrics.clickRate }}</strong></span
      >
    </div>
    <div class="metrics-legend">
      <span class="legend-label">ⓘ 指标说明：</span>
      <span
        ><b class="single-hook">✓ 单钩</b> 消息已发送到对方手机（关机 /
        无网络也算）</span
      >
      <span
        ><b class="double-hook">✓✓ 双钩</b> 对方 WhatsApp 在线、设备 100%
        收到</span
      >
      <span class="delay-tip"
        >◷ 双钩有延迟，仅作参考；落地率 ≈ 双钩率 + 20%</span
      >
      <span class="sync-tip"
        >◉ 为提高机器性能，本页面数据每 1 分钟同步更新一次</span
      >
    </div>
  </div>
</template>

<style scoped lang="scss">
.metrics-section {
  margin-bottom: 12px;
  overflow: hidden;
  font-size: 13px;
  background: linear-gradient(90deg, #eef6ff, #effbf8);
  border: 1px solid #c8e0f5;
  border-radius: 8px;
}

.metrics-row,
.metrics-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 22px;
  align-items: center;
  min-height: 34px;
  padding: 6px 16px;
}

.metrics-row {
  color: var(--el-text-color-secondary);
}

.metrics-row i {
  width: 1px;
  height: 16px;
  background: #c6d8e8;
}

.metrics-row strong {
  margin-left: 4px;
  font-size: 15px;
  color: var(--el-text-color-primary);
}

.summary-label {
  color: #64748b;
}

.single-hook {
  color: #08a84f;
}

.double-hook,
.click-metric {
  color: #1688e5;
}

.click-rate {
  color: #08a84f !important;
}

.metrics-legend {
  min-height: 32px;
  padding-top: 5px;
  padding-bottom: 5px;
  color: var(--el-text-color-secondary);
  border-top: 1px solid #d6e7f3;
}

.legend-label {
  color: #7b91aa;
}

.delay-tip,
.sync-tip {
  color: #e98516;
}
</style>
