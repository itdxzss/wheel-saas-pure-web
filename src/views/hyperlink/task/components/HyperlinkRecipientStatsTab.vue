<script setup lang="ts">
import { computed, proxyRefs } from "vue";
import dayjs from "dayjs";
import { PureTableBar } from "@/components/RePureTableBar";
import WheelPagination from "@/components/WheelPagination/index.vue";
import { hasPerms } from "@/utils/auth";
import { useHyperlinkRecipientStats } from "../composables/useHyperlinkRecipientStats";
import {
  countryFlag,
  recipientPageSizes,
  recipientStatusLabel,
  recipientStatusTagType
} from "../domain/recipient-stats";

defineOptions({ name: "HyperlinkRecipientStatsTab" });

const props = defineProps<{ taskId: number }>();
const currentTaskId = computed(() => (props.taskId > 0 ? props.taskId : null));
const state = proxyRefs(useHyperlinkRecipientStats(currentTaskId));
const canExport = computed(() => hasPerms("tenant:hyperlink_task:export"));
const columns: TableColumnList = [
  { label: "收信号码", prop: "recipientPhone", minWidth: 180 },
  { label: "发送账号", prop: "senderPhone", minWidth: 180 },
  { label: "状态 / 失败原因", prop: "status", minWidth: 280 }
];

function formatTime(value?: number | null): string {
  return value ? dayjs(value).format("YYYY-MM-DD HH:mm:ss") : "-";
}

function failureReason(row: {
  status: string;
  failReason: string | null;
}): string {
  if (row.status === "UNREGISTERED") return row.failReason || "号码未注册";
  return row.failReason || "";
}

defineExpose({
  refresh: state.refresh,
  stopExportPolling: state.stopExportPolling
});
</script>

<template>
  <section class="recipient-tab">
    <el-card shadow="never" class="filter-card">
      <el-form inline @submit.prevent="state.search">
        <el-form-item label="收信号码">
          <el-input
            v-model="state.filters.phone"
            maxlength="32"
            clearable
            placeholder="支持号码片段模糊搜索"
            @keyup.enter="state.search"
          />
        </el-form-item>
        <el-form-item label="收信国家">
          <el-select
            v-model="state.filters.recipientCountryIso2"
            filterable
            clearable
            :loading="state.countriesLoading"
            placeholder="全部国家"
          >
            <el-option label="未知国家" value="UNKNOWN" />
            <el-option
              v-for="country in state.countries"
              :key="country.iso2 || country.value"
              :label="`${country.flag} ${country.nameZh}`"
              :value="country.iso2"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="发信国家">
          <el-select
            v-model="state.filters.senderCountryIso2"
            filterable
            clearable
            :loading="state.countriesLoading"
            placeholder="全部国家"
          >
            <el-option label="未知国家" value="UNKNOWN" />
            <el-option
              v-for="country in state.countries"
              :key="country.iso2 || country.value"
              :label="`${country.flag} ${country.nameZh}`"
              :value="country.iso2"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="完整失败原因">
          <el-input
            v-model="state.filters.failReason"
            maxlength="255"
            clearable
            placeholder="严格匹配完整原因"
            @keyup.enter="state.search"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="state.search">搜索</el-button>
          <el-button @click="state.reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <PureTableBar
      title="收信人流水统计"
      :columns="columns"
      table-key="hyperlink-recipient-stats"
      @refresh="state.refresh"
    >
      <template #buttons>
        <el-button
          v-if="canExport"
          type="primary"
          plain
          :loading="state.exporting"
          :disabled="state.exporting"
          @click="state.exportRecipients"
        >
          导出
        </el-button>
      </template>

      <template #default="{ dynamicColumns }">
        <el-result
          v-if="state.errorMessage"
          :icon="state.permissionDenied ? 'warning' : 'error'"
          :title="state.permissionDenied ? '权限不足' : '加载失败'"
          :sub-title="state.errorMessage"
        >
          <template v-if="!state.permissionDenied" #extra>
            <el-button type="primary" @click="state.loadRecipients">
              重新加载
            </el-button>
          </template>
        </el-result>
        <template v-else>
          <el-table
            v-loading="state.loading"
            :data="state.rows"
            row-key="id"
            border
            height="calc(100vh - 480px)"
          >
            <el-table-column
              v-if="!dynamicColumns[0].hide"
              label="收信号码"
              min-width="180"
            >
              <template #default="{ row }">
                <el-tooltip
                  :content="row.recipientCountryIso2 || '未知国家'"
                  placement="top"
                >
                  <span class="identity-cell">
                    <b>{{ countryFlag(row.recipientCountryIso2) }}</b>
                    {{ row.recipientPhone }}
                  </span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column
              v-if="!dynamicColumns[1].hide"
              label="发送账号"
              min-width="180"
            >
              <template #default="{ row }">
                <span v-if="row.senderPhone" class="identity-cell">
                  <b>{{ countryFlag(row.senderCountryIso2) }}</b>
                  <span>
                    {{ row.senderPhone }}
                    <small v-if="row.accountId">#{{ row.accountId }}</small>
                  </span>
                </span>
                <span v-else class="muted">未分配</span>
              </template>
            </el-table-column>
            <el-table-column
              v-if="!dynamicColumns[2].hide"
              label="状态 / 失败原因"
              min-width="280"
            >
              <template #default="{ row }">
                <div class="status-cell">
                  <el-tag
                    :type="recipientStatusTagType(row.status)"
                    effect="plain"
                  >
                    {{ recipientStatusLabel(row.status) }}
                  </el-tag>
                  <span class="status-time">{{
                    formatTime(row.statusAt)
                  }}</span>
                  <el-tooltip
                    v-if="failureReason(row)"
                    :content="failureReason(row)"
                    placement="top"
                  >
                    <el-tag type="danger" effect="light" class="failure-reason">
                      原因：{{ failureReason(row) }}
                    </el-tag>
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>
            <template #empty>
              <el-empty description="暂无符合条件的收信人流水" />
            </template>
          </el-table>

          <WheelPagination
            :current-page="state.page"
            :page-size="state.pageSize"
            :page-sizes="recipientPageSizes"
            :total="state.total"
            @update:current-page="state.changePage"
            @update:page-size="state.changePageSize"
          />
        </template>
      </template>
    </PureTableBar>
  </section>
</template>

<style scoped>
.filter-card {
  margin-top: 14px;
}

.filter-card :deep(.el-form-item) {
  margin-bottom: 0;
}

.filter-card :deep(.el-input),
.filter-card :deep(.el-select) {
  width: 210px;
}

.identity-cell {
  display: inline-flex;
  gap: 7px;
  align-items: center;
}

.identity-cell small {
  display: block;
  margin-top: 2px;
  color: var(--el-text-color-secondary);
}

.status-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.status-time,
.muted {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.failure-reason {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
