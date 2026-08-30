<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import echarts from "@/plugins/echarts";
import type {
  HyperlinkMarketingGranularity,
  HyperlinkMarketingMetric
} from "@/api/hyperlink-analysis";

defineOptions({ name: "HyperlinkMarketingStatsTrendChart" });
const props = defineProps<{
  series: HyperlinkMarketingMetric[];
  granularity: HyperlinkMarketingGranularity;
}>();
const container = ref<HTMLDivElement>();
let chart: ReturnType<typeof echarts.init> | undefined;
let resizeObserver: ResizeObserver | undefined;

function bucketLabel(value: string): string {
  return props.granularity === "day" ? value.slice(5, 10) : value.slice(5, 16);
}

function render(): void {
  if (!container.value) return;
  chart ??= echarts.init(container.value);
  chart.setOption(
    {
      animationDuration: 240,
      tooltip: { trigger: "axis" },
      legend: { data: ["发送量", "单钩量", "封号数", "号均（单钩 / 号）"] },
      grid: { left: 56, right: 64, top: 52, bottom: 58 },
      xAxis: {
        type: "category",
        data: props.series.map(item => bucketLabel(item.statTime ?? "")),
        axisLabel: { rotate: props.series.length > 36 ? 45 : 0 }
      },
      yAxis: [
        { type: "value", minInterval: 1, name: "条数 / 账号" },
        { type: "value", name: "号均" }
      ],
      series: [
        {
          name: "发送量",
          type: "line",
          smooth: true,
          showSymbol: false,
          data: props.series.map(item => item.sendTotal),
          lineStyle: { color: "#409eff" }
        },
        {
          name: "单钩量",
          type: "line",
          smooth: true,
          showSymbol: false,
          data: props.series.map(item => item.successNum),
          lineStyle: { color: "#67c23a" }
        },
        {
          name: "封号数",
          type: "bar",
          data: props.series.map(item => item.bannedAccountCount),
          itemStyle: { color: "#f56c6c" }
        },
        {
          name: "号均（单钩 / 号）",
          type: "line",
          yAxisIndex: 1,
          smooth: true,
          showSymbol: false,
          data: props.series.map(item => item.avgSendPerAccount),
          lineStyle: { color: "#e6a23c", type: "dashed" }
        }
      ]
    },
    true
  );
}

watch(() => props.series, render, { deep: true });
watch(() => props.granularity, render);
onMounted(() => {
  render();
  if (container.value) {
    resizeObserver = new ResizeObserver(() => chart?.resize());
    resizeObserver.observe(container.value);
  }
});
onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  chart?.dispose();
});
</script>

<template>
  <div class="trend-shell">
    <div ref="container" class="trend-chart" />
    <el-empty
      v-if="series.length === 0"
      class="empty-overlay"
      description="暂无趋势数据"
    />
  </div>
</template>

<style scoped>
.trend-shell {
  position: relative;
  min-height: 410px;
}

.trend-chart {
  width: 100%;
  height: 410px;
}

.empty-overlay {
  position: absolute;
  inset: 50px 0 0;
  background: var(--el-bg-color);
}
</style>
