<script setup lang="ts">
import type { DataPackageListItem } from "@/api/hyperlink-data-package";
import { percentage } from "../composables/useDataPackagePage";

defineOptions({ name: "DataPackageFunnelCell" });

defineProps<{ row: DataPackageListItem }>();
</script>

<template>
  <div class="funnel-cell">
    <div class="funnel-line single">
      <span>✓ 单钩</span>
      <span class="funnel-bar"><i class="single-fill" /></span>
      <strong>{{
        (row.metrics.sentCount + row.metrics.deliveredCount).toLocaleString()
      }}</strong>
    </div>
    <div class="funnel-line double">
      <span>✓✓ 双钩</span>
      <span class="funnel-bar">
        <i
          class="double-fill"
          :style="{
            width: percentage(
              row.metrics.deliveredCount,
              row.metrics.sentCount + row.metrics.deliveredCount
            )
          }"
        />
      </span>
      <strong>{{ row.metrics.deliveredCount.toLocaleString() }}</strong>
      <small>{{
        percentage(
          row.metrics.deliveredCount,
          row.metrics.sentCount + row.metrics.deliveredCount
        )
      }}</small>
    </div>
    <div class="funnel-line click">
      <span>◉ 点击 UV</span>
      <span class="funnel-bar">
        <i
          class="click-fill"
          :style="{
            width: percentage(
              row.metrics.clickUvCount,
              row.metrics.sentCount + row.metrics.deliveredCount
            )
          }"
        />
      </span>
      <strong>{{ row.metrics.clickUvCount.toLocaleString() }}</strong>
      <small>{{
        percentage(
          row.metrics.clickUvCount,
          row.metrics.sentCount + row.metrics.deliveredCount
        )
      }}</small>
    </div>
  </div>
</template>

<style scoped>
.funnel-cell {
  display: flex;
  flex-direction: column;
  gap: 7px;
  font-size: 12px;
}

.funnel-line {
  display: grid;
  grid-template-columns: 62px minmax(42px, 1fr) 48px 52px;
  gap: 6px;
  align-items: center;
}

.funnel-line strong {
  color: var(--el-text-color-primary);
  text-align: right;
}

.funnel-line small {
  color: var(--el-text-color-secondary);
  text-align: right;
}

.funnel-bar {
  height: 6px;
  overflow: hidden;
  background: var(--el-fill-color);
  border-radius: 3px;
}

.funnel-bar i {
  display: block;
  height: 100%;
}

.single-fill {
  width: 100%;
  background: var(--el-color-success-light-3);
}

.double-fill {
  background: var(--el-color-success-dark-2);
}

.click-fill {
  background: var(--el-color-warning);
}

.single {
  color: var(--el-color-success-light-3);
}

.double {
  color: var(--el-color-success-dark-2);
}

.click {
  color: var(--el-color-warning);
}
</style>
