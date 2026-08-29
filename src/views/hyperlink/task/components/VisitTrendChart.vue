<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import echarts from "@/plugins/echarts";
import {
  formatHyperlinkTime,
  type HyperlinkVisitTrend
} from "@/api/hyperlink-task-analysis";

defineOptions({ name: "HyperlinkVisitTrendChart" });
const props = defineProps<{ trend: HyperlinkVisitTrend }>();
const container = ref<HTMLDivElement>();
let chart: ReturnType<typeof echarts.init> | undefined;
let resizeObserver: ResizeObserver | undefined;

function render(): void {
  if (!container.value) return;
  chart ??= echarts.init(container.value);
  const surgeTimes = new Set(
    props.trend.insights
      .filter(item => item.eventType === "SURGE_START")
      .map(item => item.eventTime)
  );
  chart.setOption(
    {
      animationDuration: 240,
      tooltip: {
        trigger: "axis",
        formatter: (items: any[]) => {
          const row = props.trend.series[items[0]?.dataIndex ?? 0];
          if (!row) return "";
          return [
            `${formatHyperlinkTime(row.bucketTime)} — ${formatHyperlinkTime(row.bucketEndTime)}`,
            `新增 UV：${row.newUv}`,
            `累计点击率：${row.cumulativeClickRate.toFixed(2)}%`,
            `PV：${row.pv == null ? "—（缺少逐次访问事实）" : row.pv}`,
            surgeTimes.has(row.bucketTime) ? "趋势：明显增高" : ""
          ]
            .filter(Boolean)
            .join("<br>");
        }
      },
      legend: {
        data: ["新增 UV", "累计点击率", "PV（辅助）"],
        selected: { "PV（辅助）": false }
      },
      grid: { left: 50, right: 58, top: 54, bottom: 64 },
      xAxis: {
        type: "category",
        data: props.trend.series.map(item =>
          formatHyperlinkTime(item.bucketTime).slice(5, 16)
        ),
        axisLabel: { rotate: props.trend.series.length > 48 ? 45 : 0 }
      },
      yAxis: [
        { type: "value", minInterval: 1, name: "访问量" },
        { type: "value", name: "点击率", axisLabel: { formatter: "{value}%" } }
      ],
      series: [
        {
          name: "新增 UV",
          type: "bar",
          data: props.trend.series.map(item => ({
            value: item.newUv,
            itemStyle: {
              color: surgeTimes.has(item.bucketTime) ? "#e6a23c" : "#409eff"
            }
          }))
        },
        {
          name: "累计点击率",
          type: "line",
          yAxisIndex: 1,
          smooth: true,
          showSymbol: false,
          data: props.trend.series.map(item => item.cumulativeClickRate),
          lineStyle: { color: "#67c23a" }
        },
        {
          name: "PV（辅助）",
          type: "bar",
          data: props.trend.series.map(item => item.pv),
          itemStyle: { color: "#909399" }
        }
      ]
    },
    true
  );
}

watch(() => props.trend, render, { deep: true });
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

<template><div ref="container" class="trend-chart" /></template>

<style scoped>
.trend-chart {
  width: 100%;
  height: 390px;
}
</style>
