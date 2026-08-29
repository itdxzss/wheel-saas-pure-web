<script setup lang="ts">
import { computed } from "vue";
import type { HyperlinkTaskListItem } from "@/api/hyperlink-task-list";
import { currentPageMetrics } from "../domain/list-display";

const props = defineProps<{ rows: HyperlinkTaskListItem[] }>();
const metrics = computed(() => currentPageMetrics(props.rows));
</script>

<template>
  <div class="metrics-section">
    <div class="metrics-grid">
      <el-card shadow="never"
        ><span>任务数</span><strong>{{ metrics.taskCount }}</strong></el-card
      >
      <el-card shadow="never"
        ><span>发送总数（本页受众）</span
        ><strong>{{ metrics.recipientTotal.toLocaleString() }}</strong></el-card
      >
      <el-card shadow="never" class="single-hook"
        ><span>✓ 单钩数</span
        ><strong>{{ metrics.successNum.toLocaleString() }}</strong></el-card
      >
      <el-card shadow="never" class="double-hook"
        ><span>✓✓ 双钩数</span
        ><strong>{{ metrics.deliveredNum.toLocaleString() }}</strong
        ><small>{{ metrics.deliveryRate }}</small></el-card
      >
      <el-card shadow="never" class="click-metric"
        ><span>↗ 点击 UV</span
        ><strong>{{ metrics.clickUvNum.toLocaleString() }}</strong></el-card
      >
      <el-card shadow="never" class="click-metric"
        ><span>点击率</span><strong>{{ metrics.clickRate }}</strong></el-card
      >
    </div>
    <div class="metrics-legend">
      <span><b class="single-hook">✓</b> 单钩：消息已被 WhatsApp 接受</span>
      <span
        ><b class="double-hook">✓✓</b> 双钩：消息已送达设备，可能存在延迟</span
      >
      <span>预计落地率 ≈ 双钩率 + 20 个百分点（仅作参考）</span>
      <span>聚合数据约每 1 分钟同步一次</span>
      <el-tag size="small" effect="plain">基于本页已加载任务</el-tag>
    </div>
  </div>
</template>

<style scoped lang="scss">
.metrics-section {
  margin-bottom: 12px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}

.metrics-grid :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 86px;
}

.metrics-grid span,
.metrics-grid small {
  color: var(--el-text-color-secondary);
}

.metrics-grid strong {
  margin-top: 6px;
  font-size: 24px;
}

.single-hook {
  color: var(--el-color-success);
}

.double-hook,
.click-metric {
  color: var(--el-color-primary);
}

.metrics-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  align-items: center;
  padding: 10px 4px 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

@media (width <= 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (width <= 640px) {
  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
