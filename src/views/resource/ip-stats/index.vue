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
  allocationModeOptions,
  countryColumns,
  countryLoading,
  countryRows,
  confirmSampleCheckCountry,
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
  sampleChecking,
  sampleCheckCountry: runSampleCheckCountry,
  sampleCount,
  sampleDialogError,
  sampleDialogLoading,
  sampleDialogStats,
  sampleDialogTitle,
  sampleDialogVisible,
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

function sampleCheckCountry(row: unknown): void {
  void runSampleCheckCountry(row as IpCountryStatsRow);
}
</script>

<template>
  <div class="ip-stats-page">
    <div class="ip-stats-action-row">
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
        <el-form-item label="分配方式">
          <el-select
            v-model="searchForm.allocationMode"
            class="ip-stats-filter-control ip-stats-filter-control--sm"
          >
            <el-option
              v-for="mode in allocationModeOptions"
              :key="mode.value"
              :label="mode.label"
              :value="mode.value"
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
          <el-button
            :icon="useRenderIcon(RefreshRight)"
            @click="resetSearchForm"
          >
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
            prop="lastSampleCheckAt"
            label="最近抽检时间"
            width="180"
          >
            <template #default="{ row }">
              {{ formatTime(row.lastSampleCheckAt) }}
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[8].hide"
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
            v-if="!dynamicColumns[9].hide"
            label="操作"
            fixed="right"
            width="160"
          >
            <template #default="{ row }">
              <el-button link type="primary" @click="openCountryDetail(row)">
                查看明细
              </el-button>
              <el-button link type="primary" @click="sampleCheckCountry(row)">
                检测
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

    <el-dialog
      v-model="sampleDialogVisible"
      :title="sampleDialogTitle"
      aria-label="国家 IP 抽样检测"
      width="520px"
      destroy-on-close
    >
      <div v-loading="sampleDialogLoading" class="ip-stats-sample-dialog">
        <div class="ip-stats-sample-sub">
          当前国家共有 {{ sampleDialogStats.totalIpCount }} 个 IP，可输入抽样检测数量后随机抽取执行检测。
        </div>
        <div class="ip-stats-sample-stats">
          <div class="ip-stats-sample-stat">
            <span>IP 总数量</span>
            <b>{{ sampleDialogStats.totalIpCount }}</b>
          </div>
          <div class="ip-stats-sample-stat ip-stats-sample-stat--ok">
            <span>可用数量</span>
            <b>{{ sampleDialogStats.availableIpCount }}</b>
          </div>
          <div class="ip-stats-sample-stat ip-stats-sample-stat--warn">
            <span>使用中数量</span>
            <b>{{ sampleDialogStats.inUseIpCount }}</b>
          </div>
          <div class="ip-stats-sample-stat ip-stats-sample-stat--bad">
            <span>不可用数量</span>
            <b>{{ sampleDialogStats.unavailableIpCount }}</b>
          </div>
        </div>
        <el-form label-position="top">
          <el-form-item label="抽样检测数量" :error="sampleDialogError">
            <el-input-number
              v-model="sampleCount"
              class="ip-stats-sample-input"
              :min="1"
              :max="sampleDialogStats.totalIpCount"
              :step="1"
              step-strictly
              controls-position="right"
              :disabled="sampleDialogStats.totalIpCount === 0"
              placeholder="请输入抽样检测数量"
              @keyup.enter="confirmSampleCheckCountry"
            />
          </el-form-item>
        </el-form>
        <div class="ip-stats-sample-tip">
          {{
            sampleDialogStats.totalIpCount
              ? `数量需大于 0，且不能超过当前国家 IP 总数量 ${sampleDialogStats.totalIpCount}。`
              : "当前国家暂无 IP，无法执行抽样检测。"
          }}
        </div>
      </div>
      <template #footer>
        <el-button @click="sampleDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="sampleChecking"
          :disabled="sampleDialogStats.totalIpCount === 0"
          @click="confirmSampleCheckCountry"
        >
          检测
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.ip-stats-page {
  padding: 16px;
}

.ip-stats-action-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 12px;
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

.ip-stats-sample-dialog {
  min-height: 220px;
}

.ip-stats-sample-sub {
  margin-bottom: 14px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.ip-stats-sample-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 18px;
}

.ip-stats-sample-stat {
  padding: 10px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
}

.ip-stats-sample-stat span {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ip-stats-sample-stat b {
  font-size: 20px;
  color: var(--el-text-color-primary);
}

.ip-stats-sample-stat--ok b {
  color: var(--el-color-success);
}

.ip-stats-sample-stat--warn b {
  color: var(--el-color-warning);
}

.ip-stats-sample-stat--bad b {
  color: var(--el-color-danger);
}

.ip-stats-sample-input {
  width: 100%;
}

.ip-stats-sample-tip {
  margin-top: -8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 640px) {
  .ip-stats-sample-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
