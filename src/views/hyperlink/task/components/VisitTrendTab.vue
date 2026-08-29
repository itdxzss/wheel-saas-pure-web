<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  exportHyperlinkVisitTrend,
  downloadHyperlinkTaskExport,
  formatHyperlinkTime,
  getHyperlinkVisitTrend,
  waitForHyperlinkTaskExport,
  type HyperlinkVisitTrend,
  type VisitGranularity,
  type VisitRange
} from "@/api/hyperlink-task-analysis";
import { apiErrorMessage } from "@/utils/api-error";
import { downloadBlobFile } from "@/utils/download";
import VisitTrendChart from "./VisitTrendChart.vue";

defineOptions({ name: "HyperlinkVisitTrendTab" });
const props = defineProps<{ taskId: number }>();
const ranges: VisitRange[] = ["12h", "24h", "36h", "48h", "72h"];
const range = ref<VisitRange>("24h");
const granularity = ref<VisitGranularity>("30m");
const mode = ref<"chart" | "table">("chart");
const loading = ref(false);
const exporting = ref(false);
const errorMessage = ref("");
const trend = ref<HyperlinkVisitTrend | null>(null);
let requestSequence = 0;
let exportAbort: AbortController | undefined;

const cards = computed(() => {
  const summary = trend.value?.summary;
  return [
    { label: "总 UV", value: summary?.uvTotal ?? 0, note: "独立访客" },
    {
      label: "点击率",
      value: `${(summary?.clickRate ?? 0).toFixed(2)}%`,
      note: "UV / 单钩人数"
    },
    {
      label: "任务开始",
      value: formatHyperlinkTime(summary?.taskStartAt),
      note: "北京时间"
    },
    {
      label: "首次访问",
      value: formatHyperlinkTime(summary?.firstVisitAt),
      note: "北京时间"
    },
    {
      label: "UV 高峰",
      value: formatHyperlinkTime(summary?.peakBucketTime),
      note: `新增 ${summary?.peakNewUv ?? 0} 人`
    },
    {
      label: "总 PV",
      value: summary?.pvTotal ?? 0,
      note: `真实总量 · 人均 ${(summary?.pvPerUv ?? 0).toFixed(2)} 次`
    }
  ];
});

watch([() => props.taskId, range, granularity], () => void load(), {
  immediate: true
});
onBeforeUnmount(() => exportAbort?.abort());

async function load(): Promise<void> {
  const sequence = ++requestSequence;
  loading.value = true;
  try {
    const result = await getHyperlinkVisitTrend(
      props.taskId,
      range.value,
      granularity.value
    );
    if (sequence !== requestSequence) return;
    trend.value = result;
    errorMessage.value = "";
  } catch (error) {
    if (sequence !== requestSequence) return;
    trend.value = null;
    errorMessage.value = apiErrorMessage(error, "访问趋势加载失败");
  } finally {
    if (sequence === requestSequence) loading.value = false;
  }
}

async function exportCsv(): Promise<void> {
  exporting.value = true;
  exportAbort = new AbortController();
  try {
    const created = await exportHyperlinkVisitTrend(
      props.taskId,
      range.value,
      granularity.value
    );
    const completed = await waitForHyperlinkTaskExport(
      created,
      exportAbort.signal
    );
    const file = await downloadHyperlinkTaskExport(completed);
    downloadBlobFile(file.filename, file.blob);
    ElMessage.success("访问趋势已导出");
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "访问趋势导出失败"));
  } finally {
    exportAbort = undefined;
    exporting.value = false;
  }
}
</script>

<template>
  <section v-loading="loading" class="visit-trend-tab">
    <el-alert
      v-if="errorMessage"
      type="error"
      show-icon
      :closable="false"
      :title="errorMessage"
    >
      <el-button link type="primary" @click="load">重试</el-button>
    </el-alert>
    <div class="toolbar">
      <el-button-group>
        <el-button
          v-for="item in ranges"
          :key="item"
          :type="range === item ? 'primary' : 'default'"
          @click="range = item"
        >
          {{ item.replace("h", " 小时") }}
        </el-button>
      </el-button-group>
      <el-select v-model="granularity" class="granularity">
        <el-option label="每 30 分钟" value="30m" />
        <el-option label="每 1 小时" value="1h" />
        <el-option label="每 2 小时" value="2h" />
      </el-select>
      <el-segmented
        v-model="mode"
        :options="[
          { label: '趋势图', value: 'chart' },
          { label: '数据表', value: 'table' }
        ]"
      />
      <span class="toolbar-spacer" />
      <el-button
        v-auth="'tenant:hyperlink_task:export'"
        :loading="exporting"
        @click="exportCsv"
        >导出</el-button
      >
      <el-button @click="load">刷新</el-button>
    </div>
    <el-alert
      type="info"
      :closable="false"
      title="数据统计范围：从第一个 UV 出现开始，向后所选小时数。当前模型仅保留累计 PV，历史逐时 PV 不伪造分桶。"
    />

    <div class="metric-grid">
      <el-card v-for="card in cards" :key="card.label" shadow="never">
        <div class="metric-label">{{ card.label }}</div>
        <div class="metric-value">{{ card.value }}</div>
        <small>{{ card.note }}</small>
      </el-card>
    </div>

    <template v-if="trend">
      <div v-if="mode === 'chart'" class="chart-layout">
        <el-card shadow="never" class="chart-card">
          <template #header
            ><strong>访问量走势</strong
            ><small>北京时间 · {{ granularity }}</small></template
          >
          <VisitTrendChart :trend="trend" />
        </el-card>
        <el-card shadow="never" class="insight-card">
          <template #header><strong>趋势解读</strong></template>
          <el-timeline v-if="trend.insights.length">
            <el-timeline-item
              v-for="item in trend.insights"
              :key="`${item.eventType}-${item.eventTime}`"
              :timestamp="formatHyperlinkTime(item.eventTime)"
            >
              <strong>{{ item.title }}</strong>
              <div>{{ item.detail || "" }}</div>
            </el-timeline-item>
          </el-timeline>
          <el-empty
            v-else
            description="当前时段暂无趋势事件"
            :image-size="70"
          />
          <el-divider />
          <strong>新增 UV 最高的 {{ trend.topPeaks.length }} 个时间段</strong>
          <div v-for="peak in trend.topPeaks" :key="peak.rank" class="peak-row">
            #{{ peak.rank }} {{ formatHyperlinkTime(peak.bucketTime) }} · 新增
            {{ peak.newUv }}
          </div>
          <el-empty
            v-if="!trend.topPeaks.length"
            description="暂无高峰时段"
            :image-size="60"
          />
        </el-card>
      </div>

      <el-table
        v-else
        :data="trend.series"
        border
        size="small"
        max-height="520"
      >
        <el-table-column label="时间段（北京时间）" min-width="310">
          <template #default="{ row }"
            >{{ formatHyperlinkTime(row.bucketTime) }} —
            {{ formatHyperlinkTime(row.bucketEndTime) }}</template
          >
        </el-table-column>
        <el-table-column prop="newUv" label="新增 UV" min-width="110" />
        <el-table-column prop="cumulativeUv" label="累计 UV" min-width="110" />
        <el-table-column label="累计点击率" min-width="130">
          <template #default="{ row }"
            >{{ row.cumulativeClickRate.toFixed(2) }}%</template
          >
        </el-table-column>
        <el-table-column label="PV（辅助）" min-width="150">
          <template #default="{ row }">{{
            row.pv == null ? "—" : row.pv
          }}</template>
        </el-table-column>
      </el-table>
    </template>
  </section>
</template>

<style scoped>
.visit-trend-tab {
  min-height: 560px;
}

.toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
  margin: 12px 0;
}

.toolbar-spacer {
  flex: 1;
}

.granularity {
  width: 145px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(130px, 1fr));
  gap: 10px;
  margin: 12px 0;
}

.metric-label,
.chart-card small {
  color: var(--el-text-color-secondary);
}

.metric-value {
  margin: 8px 0 4px;
  font-size: 20px;
  font-weight: 600;
}

.chart-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 310px;
  gap: 12px;
}

.chart-card :deep(.el-card__header) {
  display: flex;
  justify-content: space-between;
}

.peak-row {
  margin-top: 10px;
  color: var(--el-text-color-regular);
}

@media (width <= 1280px) {
  .metric-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .chart-layout {
    grid-template-columns: 1fr;
  }
}
</style>
