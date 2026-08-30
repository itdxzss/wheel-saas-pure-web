<script setup lang="ts">
import { computed } from "vue";
import { marketingCountryFlag } from "./domain/marketing-stats";
import MarketingStatsCountryTable from "./components/MarketingStatsCountryTable.vue";
import MarketingStatsKpis from "./components/MarketingStatsKpis.vue";
import MarketingStatsTrendChart from "./components/MarketingStatsTrendChart.vue";
import { useHyperlinkMarketingAnalysis } from "./composables/useHyperlinkMarketingAnalysis";

defineOptions({ name: "HyperlinkAnalysis" });

const {
  filters,
  items,
  resultGranularity,
  loading,
  errorMessage,
  countriesLoading,
  countriesError,
  senderCountries,
  recipientCountries,
  series,
  overview,
  countryScope,
  viewMode,
  loadCountries,
  refresh,
  search,
  changeGranularity,
  applyPreset,
  reset
} = useHyperlinkMarketingAnalysis();

const pickerType = computed(() =>
  filters.granularity === "day" ? "daterange" : "datetimerange"
);
const pickerFormat = computed(() =>
  filters.granularity === "day" ? "YYYY-MM-DD" : "YYYY-MM-DD HH:mm:ss"
);
const quickRanges = computed(() =>
  filters.granularity === "day"
    ? [
        { label: "近 7 天", span: 7 },
        { label: "近 30 天", span: 30 },
        { label: "近 90 天", span: 90 }
      ]
    : [
        { label: "近 24 小时", span: 24 },
        { label: "近 3 天", span: 72 },
        { label: "近 7 天", span: 168 }
      ]
);
</script>

<template>
  <div class="analysis-page">
    <el-card shadow="never" class="header-card">
      <div>
        <h2>超链市场分析</h2>
        <p>从发信国到被营销国家，对比发送、落地、点击与风控表现。</p>
      </div>
      <el-alert
        title="日维度最多查询 90 天，小时维度最多查询 7 天。"
        type="info"
        :closable="false"
      />
    </el-card>

    <el-card shadow="never" class="filter-card">
      <div class="filter-toolbar">
        <el-radio-group
          v-model="filters.granularity"
          @change="changeGranularity"
        >
          <el-radio-button value="day">按日</el-radio-button>
          <el-radio-button value="hour">按小时</el-radio-button>
        </el-radio-group>
        <div class="quick-ranges">
          <el-button
            v-for="item in quickRanges"
            :key="item.label"
            size="small"
            plain
            @click="applyPreset(item.span)"
          >
            {{ item.label }}
          </el-button>
        </div>
      </div>

      <el-form
        label-position="top"
        class="filter-grid"
        @submit.prevent="search"
      >
        <el-form-item label="统计时间" class="date-filter">
          <el-date-picker
            v-model="filters.dateRange"
            :type="pickerType"
            :value-format="pickerFormat"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            :clearable="false"
          />
        </el-form-item>
        <el-form-item label="任务类型">
          <el-select
            v-model="filters.taskType"
            clearable
            placeholder="全部任务"
          >
            <el-option label="即时群发" :value="1" />
            <el-option label="预发布" :value="2" />
            <el-option label="周期循环" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="发信国家">
          <el-select
            v-model="filters.senderCountryIso2"
            clearable
            filterable
            :loading="countriesLoading"
            placeholder="全部国家"
          >
            <el-option
              v-for="country in senderCountries"
              :key="country"
              :label="`${marketingCountryFlag(country)} ${country}`"
              :value="country"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="被营销国家">
          <el-select
            v-model="filters.recipientCountryIso2"
            clearable
            filterable
            :loading="countriesLoading"
            placeholder="全部国家"
          >
            <el-option
              v-for="country in recipientCountries"
              :key="country"
              :label="`${marketingCountryFlag(country)} ${country}`"
              :value="country"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="账号类型">
          <el-select v-model="filters.accountType" clearable placeholder="全部">
            <el-option label="个人号" :value="1" />
            <el-option label="商业号" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备系统">
          <el-select v-model="filters.deviceOs" clearable placeholder="全部">
            <el-option label="Android" value="android" />
            <el-option label="iPhone" value="iphone" />
          </el-select>
        </el-form-item>
        <el-form-item label="深度追踪">
          <el-select
            v-model="filters.shortLinkEnabled"
            clearable
            placeholder="全部"
          >
            <el-option label="已启用" :value="true" />
            <el-option label="未启用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label=" ">
          <div class="filter-actions">
            <el-button type="primary" :loading="loading" @click="search">
              查询
            </el-button>
            <el-button @click="reset">重置</el-button>
          </div>
        </el-form-item>
      </el-form>

      <el-alert
        v-if="countriesError"
        type="warning"
        show-icon
        :closable="false"
        :title="countriesError"
      >
        <el-button link type="primary" @click="loadCountries"
          >重试国家候选</el-button
        >
      </el-alert>
    </el-card>

    <el-alert
      v-if="errorMessage"
      class="error-alert"
      type="error"
      show-icon
      :closable="false"
      :title="errorMessage"
    >
      <el-button link type="primary" @click="refresh()">重新加载</el-button>
    </el-alert>

    <MarketingStatsKpis
      :overview="overview"
      :granularity="resultGranularity"
      :country-scope="countryScope"
    />

    <el-card shadow="never" class="result-card">
      <template #header>
        <div class="result-header">
          <div>
            <b>市场表现</b>
            <small v-if="viewMode === 'table'">
              按“发信国 → 被营销国”汇总，展开可查看时间明细
            </small>
            <small v-else>
              所有国家对按{{
                resultGranularity === "day" ? "日" : "小时"
              }}汇总趋势
            </small>
          </div>
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button value="table">国家对表</el-radio-button>
            <el-radio-button value="trend">趋势图</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <MarketingStatsCountryTable
        v-if="viewMode === 'table'"
        :items="items"
        :loading="loading"
      />
      <MarketingStatsTrendChart
        v-else
        :series="series"
        :granularity="resultGranularity"
      />
    </el-card>
  </div>
</template>

<style scoped>
.analysis-page {
  min-width: 1180px;
  padding: 14px 16px;
  background: #f4f6f9;
}

.header-card,
.filter-card,
.error-alert {
  margin-bottom: 12px;
}

.header-card :deep(.el-card__body) {
  display: grid;
  grid-template-columns: minmax(320px, 0.8fr) minmax(480px, 1.2fr);
  gap: 20px;
  align-items: center;
}

h2,
p {
  margin: 0;
}

p,
.result-header small {
  color: var(--el-text-color-secondary);
}

.filter-toolbar,
.quick-ranges,
.filter-actions,
.result-header {
  display: flex;
  gap: 8px;
  align-items: center;
}

.filter-toolbar,
.result-header {
  justify-content: space-between;
}

.filter-toolbar {
  margin-bottom: 14px;
}

.quick-ranges :deep(.el-button + .el-button) {
  margin-left: 0;
}

.filter-grid {
  display: grid;
  grid-template-columns: minmax(360px, 1.8fr) repeat(6, minmax(130px, 1fr));
  gap: 0 12px;
}

.filter-grid :deep(.el-form-item),
.filter-grid :deep(.el-select),
.date-filter :deep(.el-date-editor) {
  width: 100%;
}

.filter-actions {
  height: 32px;
}

.result-header > div:first-child {
  display: grid;
  gap: 3px;
}

@media (width <= 1450px) {
  .filter-grid {
    grid-template-columns: minmax(360px, 2fr) repeat(3, minmax(160px, 1fr));
  }
}
</style>
