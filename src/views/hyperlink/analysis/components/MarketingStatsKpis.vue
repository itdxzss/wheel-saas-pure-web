<script setup lang="ts">
import { computed } from "vue";
import type { HyperlinkMarketingGranularity } from "@/api/hyperlink-analysis";
import {
  formatMarketingAverage,
  formatMarketingCount,
  formatMarketingRate,
  type HyperlinkMarketingOverview
} from "../domain/marketing-stats";

const props = defineProps<{
  overview: HyperlinkMarketingOverview;
  granularity: HyperlinkMarketingGranularity;
  countryScope: string;
}>();

const bucketLabel = computed(() =>
  props.granularity === "day" ? "日" : "小时"
);
const cards = computed(() => [
  {
    key: "send",
    tone: "blue",
    icon: "↗",
    title: "发送量",
    value: formatMarketingCount(props.overview.sendTotal),
    note: props.overview.buckets
      ? `每${bucketLabel.value}均 ≈ ${formatMarketingAverage(props.overview.sendPerBucket)}`
      : "尚无时间分桶",
    description: "所选时间和筛选下尝试发出的超链消息条数。"
  },
  {
    key: "success",
    tone: "green",
    icon: "✓",
    title: "单钩 / 单钩率",
    value: formatMarketingCount(props.overview.successNum),
    supplement: formatMarketingRate(props.overview.successRate),
    note: "单钩率 = 单钩 ÷ 发送",
    description: "WhatsApp 单钩数及其占发送量的比例。"
  },
  {
    key: "delivered",
    tone: "cyan",
    icon: "✓✓",
    title: "双钩 / 双钩率",
    value: formatMarketingCount(props.overview.deliveredNum),
    supplement: formatMarketingRate(props.overview.deliveryRate),
    note: "双钩率 = 双钩 ÷ 单钩",
    description: "双钩有延迟，仅用于辅助判断消息落地。"
  },
  {
    key: "click-rate",
    tone: "orange",
    icon: "◎",
    title: "访问率",
    value: formatMarketingRate(props.overview.clickRate),
    note: "= 点击 UV ÷ 单钩",
    description: "反映超链在已单钩受众中的点击转化效率。"
  },
  {
    key: "click-uv",
    tone: "pink",
    icon: "◉",
    title: "点击 UV",
    value: formatMarketingCount(props.overview.clickUvNum),
    note: "超链被点开的去重用户数",
    description: "所选筛选下所有超链点击 UV 总和。"
  },
  {
    key: "accounts",
    tone: "emerald",
    icon: "◇",
    title: "使用号数",
    value: formatMarketingCount(props.overview.usedAccountCount),
    note: `当前筛选：${props.countryScope}`,
    description: "所选区间内实际参与发送的账号数。"
  },
  {
    key: "average",
    tone: "amber",
    icon: "÷",
    title: "号均",
    value: formatMarketingAverage(props.overview.avgSendPerAccount),
    note: "= 单钩条数 ÷ 使用号数",
    description: "衡量单个发送账号的平均产能。"
  },
  {
    key: "banned",
    tone: "red",
    icon: "!",
    title: "封号 / 封号率",
    value: formatMarketingCount(props.overview.bannedAccountCount),
    supplement: formatMarketingRate(props.overview.banRate),
    note: "封号率 = 封号数 ÷ 使用号数",
    description: "参与发送的账号中变为封号或失效的比例。"
  }
]);
</script>

<template>
  <section class="kpi-grid" aria-label="超链市场分析核心指标">
    <el-tooltip
      v-for="card in cards"
      :key="card.key"
      :content="card.description"
      placement="bottom-start"
    >
      <el-card shadow="never" class="kpi-card" :class="`tone-${card.tone}`">
        <div class="kpi-icon">{{ card.icon }}</div>
        <div class="kpi-body">
          <span class="kpi-title">{{ card.title }}</span>
          <div class="kpi-value">
            <strong>{{ card.value }}</strong>
            <em v-if="card.supplement">{{ card.supplement }}</em>
          </div>
          <small>{{ card.note }}</small>
        </div>
      </el-card>
    </el-tooltip>
  </section>
</template>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin: 12px 0;
}

.kpi-card :deep(.el-card__body) {
  display: flex;
  gap: 12px;
  align-items: center;
  min-height: 92px;
  padding: 14px;
}

.kpi-icon {
  display: grid;
  flex: 0 0 38px;
  place-items: center;
  width: 38px;
  height: 38px;
  font-size: 18px;
  font-weight: 700;
  color: var(--card-color);
  background: color-mix(in srgb, var(--card-color) 12%, transparent);
  border-radius: 10px;
}

.kpi-body {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.kpi-title,
.kpi-body small {
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.kpi-title {
  font-size: 12px;
}

.kpi-body small {
  font-size: 11px;
}

.kpi-value {
  display: flex;
  gap: 8px;
  align-items: baseline;
}

.kpi-value strong {
  font-size: 22px;
  color: var(--el-text-color-primary);
}

.kpi-value em {
  font-size: 13px;
  font-style: normal;
  font-weight: 600;
  color: var(--card-color);
}

.tone-blue {
  --card-color: #409eff;
}

.tone-green {
  --card-color: #67c23a;
}

.tone-cyan {
  --card-color: #14b8a6;
}

.tone-orange {
  --card-color: #e6a23c;
}

.tone-pink {
  --card-color: #ec4899;
}

.tone-emerald {
  --card-color: #10b981;
}

.tone-amber {
  --card-color: #d97706;
}

.tone-red {
  --card-color: #f56c6c;
}

@media (width <= 1100px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
