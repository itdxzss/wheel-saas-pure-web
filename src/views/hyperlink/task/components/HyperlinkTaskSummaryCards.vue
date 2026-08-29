<script setup lang="ts">
import { computed } from "vue";
import type { HyperlinkTaskSummary } from "@/api/hyperlink-task-detail";
import { summaryCards } from "../domain/recipient-stats";

defineOptions({ name: "HyperlinkTaskSummaryCards" });

const props = defineProps<{
  summary: HyperlinkTaskSummary | null;
  loading: boolean;
  errorMessage: string;
  permissionDenied: boolean;
}>();

const emit = defineEmits<{ (event: "retry"): void }>();

const cards = computed(() =>
  props.summary ? summaryCards(props.summary) : []
);

function formatTime(value?: number | null): string {
  if (!value) return "尚未同步";
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}
</script>

<template>
  <section class="summary-section" aria-label="任务公共统计">
    <el-skeleton v-if="loading" :rows="2" animated />
    <el-result
      v-else-if="errorMessage"
      :icon="permissionDenied ? 'warning' : 'error'"
      :title="permissionDenied ? '权限不足' : '统计加载失败'"
      :sub-title="errorMessage"
    >
      <template v-if="!permissionDenied" #extra>
        <el-button type="primary" @click="emit('retry')">重新加载</el-button>
      </template>
    </el-result>
    <template v-else-if="summary">
      <div class="summary-cards">
        <el-tooltip
          v-for="card in cards"
          :key="card.key"
          :disabled="!card.tooltip"
          :content="card.tooltip"
          placement="top"
        >
          <el-card
            shadow="never"
            :class="`summary-card summary-card--${card.tone}`"
          >
            <span class="summary-card__title">{{ card.title }}</span>
            <div class="summary-card__value">
              {{ card.value }}
              <small v-if="card.extra">{{ card.extra }}</small>
            </div>
          </el-card>
        </el-tooltip>
      </div>

      <div class="summary-notes">
        <div class="status-legend">
          <strong>状态图例</strong>
          <span><b>✓ 单钩</b>：消息已发送到对方手机，关机或无网络时也算。</span>
          <span><b>✓✓ 双钩</b>：对方 WhatsApp 在线，设备 100% 收到。</span>
        </div>
        <el-alert type="info" :closable="false" show-icon>
          <template #title>
            双钩有延迟，仅作参考；落地率 ≈ 双钩率 +
            20%。聚合数据约每分钟同步一次， 最近同步：{{
              formatTime(summary.metricsUpdatedAt)
            }}
          </template>
        </el-alert>
      </div>
    </template>
  </section>
</template>

<style scoped>
.summary-section {
  min-height: 120px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(6, minmax(132px, 1fr));
  gap: 10px;
}

.summary-card {
  border-top: 3px solid var(--el-color-primary-light-5);
}

.summary-card--success {
  border-top-color: var(--el-color-success);
}

.summary-card--danger {
  border-top-color: var(--el-color-danger);
}

.summary-card--warning {
  border-top-color: var(--el-color-warning);
}

.summary-card--info {
  border-top-color: var(--el-color-info);
}

.summary-card__title {
  display: block;
  color: var(--el-text-color-secondary);
}

.summary-card__value {
  margin-top: 8px;
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.summary-card__value small {
  margin-left: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

.summary-notes {
  display: grid;
  grid-template-columns: minmax(360px, 1fr) minmax(420px, 1.4fr);
  gap: 12px;
  margin-top: 12px;
}

.status-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  align-items: center;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

@media (width <= 1100px) {
  .summary-cards {
    grid-template-columns: repeat(3, 1fr);
  }

  .summary-notes {
    grid-template-columns: 1fr;
  }
}

@media (width <= 640px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
