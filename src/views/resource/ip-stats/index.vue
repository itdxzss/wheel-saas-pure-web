<script setup lang="ts">
import { PureTableBar } from "@/components/RePureTableBar";
import WheelPagination from "@/components/WheelPagination/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import type { IpCountryStatsRow } from "@/api/resource-ip-stats";
import { useResourceIpStatsPage } from "./composables/useResourceIpStatsPage";
import IpStatsDetailDrawer from "./components/IpStatsDetailDrawer.vue";
import IpStatsRankList from "./components/IpStatsRankList.vue";
import IpStatsSummaryCards from "./components/IpStatsSummaryCards.vue";
import Search from "~icons/ri/search-line";
import RefreshRight from "~icons/ep/refresh-right";

defineOptions({
  name: "ResourceIpStats"
});

const {
  countryColumns,
  countryLoading,
  countryRows,
  detailColumns,
  detailLoading,
  detailPage,
  detailPageSize,
  detailRows,
  detailSearchForm,
  detailStatusOptions,
  detailSummaryCards,
  detailTotal,
  detailVisible,
  errorMessage,
  formatRate,
  formatTime,
  loadCountryRows,
  loadDetailRows,
  onCountrySortChange,
  openDetail,
  page,
  pageSize,
  proxyTypeOptions,
  rankBarWidth,
  rankLoading,
  rankRows,
  refreshAll,
  resetDetailSearchForm,
  resetSearchForm,
  riskOptions,
  riskTagType,
  searchCountries,
  searchDetailRows,
  searchForm,
  selectedCountry,
  summaryCards,
  summaryLoading,
  total
} = useResourceIpStatsPage();

function openCountryDetail(row: unknown, status: number | "" = ""): void {
  void openDetail(row as IpCountryStatsRow, status);
}
</script>

<template>
  <div class="ip-stats-page">
    <div class="ip-stats-title-row">
      <h2>IP 数据统计</h2>
      <el-button :icon="useRenderIcon(RefreshRight)" @click="refreshAll">
        刷新
      </el-button>
    </div>

    <IpStatsSummaryCards :cards="summaryCards" :loading="summaryLoading" />

    <IpStatsRankList
      :loading="rankLoading"
      :rank-bar-width="rankBarWidth"
      :rows="rankRows"
    />

    <div class="ip-stats-search bg-bg_color">
      <el-form :model="searchForm" inline>
        <el-form-item label="国家/地区">
          <el-input
            v-model="searchForm.keyword"
            clearable
            placeholder="请输入国家/地区"
            class="ip-stats-filter-control"
            @keyup.enter="searchCountries"
          />
        </el-form-item>
        <el-form-item label="资源状态">
          <el-select
            v-model="searchForm.risk"
            class="ip-stats-filter-control ip-stats-filter-control--sm"
          >
            <el-option
              v-for="risk in riskOptions"
              :key="risk.value"
              :label="risk.label"
              :value="risk.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="协议类型">
          <el-select
            v-model="searchForm.proxyType"
            clearable
            placeholder="全部"
            class="ip-stats-filter-control ip-stats-filter-control--sm"
          >
            <el-option
              v-for="type in proxyTypeOptions"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="来源">
          <el-input
            v-model="searchForm.source"
            clearable
            placeholder="请输入来源"
            class="ip-stats-filter-control"
            @keyup.enter="searchCountries"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="useRenderIcon(Search)"
            @click="searchCountries"
          >
            查询
          </el-button>
          <el-button :icon="useRenderIcon(RefreshRight)" @click="resetSearchForm">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-alert
      v-if="errorMessage"
      class="ip-stats-error"
      type="error"
      show-icon
      :closable="false"
      :title="errorMessage"
    />

    <PureTableBar
      title="国家维度统计"
      :columns="countryColumns"
      @refresh="refreshAll"
    >
      <template #default="{ dynamicColumns }">
        <el-table
          v-loading="countryLoading"
          :data="countryRows"
          row-key="region"
          border
          :default-sort="{ prop: 'totalIpCount', order: 'descending' }"
          @sort-change="onCountrySortChange"
        >
          <el-table-column
            v-if="!dynamicColumns[0].hide"
            prop="region"
            label="国家"
            min-width="160"
            show-overflow-tooltip
          />
          <el-table-column
            v-if="!dynamicColumns[1].hide"
            prop="totalIpCount"
            label="IP 总数"
            width="120"
            sortable="custom"
          >
            <template #default="{ row }">
              <el-button link type="primary" @click="openCountryDetail(row)">
                {{ row.totalIpCount }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[2].hide"
            prop="inUseIpCount"
            label="使用中 IP 数"
            width="130"
            sortable="custom"
          >
            <template #default="{ row }">
              <el-button link type="primary" @click="openCountryDetail(row, 2)">
                {{ row.inUseIpCount }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[3].hide"
            prop="idleIpCount"
            label="空闲 IP 数"
            width="120"
            sortable="custom"
          >
            <template #default="{ row }">
              <el-button link type="primary" @click="openCountryDetail(row, 1)">
                {{ row.idleIpCount }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[4].hide"
            prop="unavailableIpCount"
            label="不可用 IP 数"
            width="130"
            sortable="custom"
          >
            <template #default="{ row }">
              <el-button link type="danger" @click="openCountryDetail(row, 3)">
                {{ row.unavailableIpCount }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[5].hide"
            prop="availableRate"
            label="可用率"
            width="120"
            sortable="custom"
          >
            <template #default="{ row }">
              {{ formatRate(row.availableRate) }}%
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[6].hide"
            prop="unavailableRate"
            label="不可用率"
            width="120"
            sortable="custom"
          >
            <template #default="{ row }">
              {{ formatRate(row.unavailableRate) }}%
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[7].hide"
            prop="resourceRisk"
            label="资源状态"
            width="140"
          >
            <template #default="{ row }">
              <el-tag size="small" :type="riskTagType(row.resourceRisk)">
                {{ row.resourceRiskLabel }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[8].hide"
            label="操作"
            fixed="right"
            width="120"
          >
            <template #default="{ row }">
              <el-button link type="primary" @click="openCountryDetail(row)">
                查看明细
              </el-button>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="未找到符合条件的国家统计数据" />
          </template>
        </el-table>

        <WheelPagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          @change="loadCountryRows"
        />
      </template>
    </PureTableBar>

    <IpStatsDetailDrawer
      v-model="detailVisible"
      v-model:page="detailPage"
      v-model:page-size="detailPageSize"
      v-model:search-form="detailSearchForm"
      :columns="detailColumns"
      :country="selectedCountry"
      :detail-status-options="detailStatusOptions"
      :format-time="formatTime"
      :loading="detailLoading"
      :proxy-type-options="proxyTypeOptions"
      :rows="detailRows"
      :summary-cards="detailSummaryCards"
      :total="detailTotal"
      @refresh="loadDetailRows"
      @reset="resetDetailSearchForm"
      @search="searchDetailRows"
    />
  </div>
</template>

<style scoped>
.ip-stats-page {
  padding: 16px;
}

.ip-stats-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.ip-stats-title-row h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.ip-stats-search {
  padding: 16px 16px 0;
  margin-bottom: 8px;
  border-radius: 4px;
}

.ip-stats-search :deep(.el-form-item) {
  margin-right: 16px;
  margin-bottom: 16px;
}

.ip-stats-filter-control {
  width: 180px;
}

.ip-stats-filter-control--sm {
  width: 140px;
}

.ip-stats-error {
  margin-bottom: 12px;
}
</style>
