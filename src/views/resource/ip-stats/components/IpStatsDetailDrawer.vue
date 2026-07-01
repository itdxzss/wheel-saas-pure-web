<script setup lang="ts">
import { computed } from "vue";
import WheelPagination from "@/components/WheelPagination/index.vue";
import type {
  IpCountryStatsRow,
  IpStatsDetailRow
} from "@/api/resource-ip-stats";
import type { ProxyTypeLabel } from "@/api/resource-ip-mapping";
import type { IpStatsDetailSearchForm } from "../composables/useResourceIpStatsPage";

defineOptions({
  name: "IpStatsDetailDrawer"
});

const props = defineProps<{
  columns: TableColumnList;
  country: IpCountryStatsRow | null;
  detailStatusOptions: Array<{ label: string; value: number | "" }>;
  formatTime: (value: number | null | undefined) => string;
  checkingRowIds: Set<number>;
  loading: boolean;
  proxyTypeOptions: ProxyTypeLabel[];
  rows: IpStatsDetailRow[];
  summaryCards: Array<[string, number | string]>;
  total: number;
}>();

const emit = defineEmits<{
  (event: "check", row: IpStatsDetailRow): void;
  (event: "refresh"): void;
  (event: "reset"): void;
  (event: "search"): void;
  (event: "update:page", value: number): void;
  (event: "update:pageSize", value: number): void;
}>();

const visible = defineModel<boolean>({ required: true });
const searchForm = defineModel<IpStatsDetailSearchForm>("searchForm", {
  required: true
});
const page = defineModel<number>("page", { required: true });
const pageSize = defineModel<number>("pageSize", { required: true });

const drawerTitle = computed(() =>
  props.country ? `国家 IP 明细 - ${props.country.region}` : "国家 IP 明细"
);

function detailRowId(row: unknown): number | null {
  if (typeof row !== "object" || row === null || !("id" in row)) return null;
  const id = (row as { id?: unknown }).id;
  return typeof id === "number" ? id : null;
}

function isRowChecking(row: unknown): boolean {
  const id = detailRowId(row);
  return id !== null && props.checkingRowIds.has(id);
}

function isCheckDisabled(row: unknown): boolean {
  return props.checkingRowIds.size > 0 && !isRowChecking(row);
}

function emitCheck(row: unknown): void {
  emit("check", row as IpStatsDetailRow);
}
</script>

<template>
  <el-drawer v-model="visible" :title="drawerTitle" size="78%" destroy-on-close>
    <div class="ip-detail-drawer">
      <div class="ip-detail-summary">
        <div
          v-for="[label, value] in summaryCards"
          :key="label"
          class="ip-detail-summary-item"
        >
          <span>{{ label }}</span>
          <b>{{ value }}</b>
        </div>
      </div>

      <el-form class="ip-detail-filter" :model="searchForm" inline>
        <el-form-item label="IP 地址">
          <el-input
            v-model="searchForm.ipKeyword"
            clearable
            placeholder="输入 IP 地址"
            class="ip-detail-filter-control"
            @keyup.enter="emit('search')"
          />
        </el-form-item>
        <el-form-item label="账号">
          <el-input
            v-model="searchForm.accountKeyword"
            clearable
            placeholder="输入账号"
            class="ip-detail-filter-control"
            @keyup.enter="emit('search')"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            class="ip-detail-filter-control ip-detail-filter-control--sm"
          >
            <el-option
              v-for="item in detailStatusOptions"
              :key="String(item.value)"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="协议类型">
          <el-select
            v-model="searchForm.proxyType"
            clearable
            placeholder="全部"
            class="ip-detail-filter-control ip-detail-filter-control--sm"
          >
            <el-option
              v-for="type in proxyTypeOptions"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="emit('search')">查询</el-button>
          <el-button @click="emit('reset')">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="rows" row-key="id" border>
        <el-table-column
          v-if="!columns[0].hide"
          prop="proxyHost"
          label="IP 地址"
          min-width="160"
          show-overflow-tooltip
        />
        <el-table-column
          v-if="!columns[1].hide"
          prop="proxyPort"
          label="端口"
          width="100"
        >
          <template #default="{ row }">
            {{ row.proxyPort ?? "-" }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="!columns[2].hide"
          prop="protocolLabel"
          label="协议类型"
          width="110"
        >
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.protocolLabel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!columns[3].hide"
          prop="allocationModeLabel"
          label="分配方式"
          width="120"
        />
        <el-table-column
          v-if="!columns[4].hide"
          prop="source"
          label="来源"
          min-width="140"
          show-overflow-tooltip
        />
        <el-table-column
          v-if="!columns[5].hide"
          prop="statusLabel"
          label="状态"
          width="110"
        />
        <el-table-column
          v-if="!columns[6].hide"
          prop="boundAccountId"
          label="当前使用账号"
          min-width="130"
        >
          <template #default="{ row }">
            {{ row.boundAccountId ?? "-" }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="!columns[7].hide"
          prop="lastSampleCheckAt"
          label="最近抽检时间"
          width="180"
        >
          <template #default="{ row }">
            {{ formatTime(row.lastSampleCheckAt) }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="!columns[8].hide"
          prop="failCount"
          label="失败次数"
          width="100"
        >
          <template #default="{ row }">
            {{ row.failCount ?? 0 }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="!columns[9].hide"
          label="操作"
          fixed="right"
          width="90"
        >
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :loading="isRowChecking(row)"
              :disabled="isCheckDisabled(row)"
              @click="emitCheck(row)"
            >
              检测
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="该国家暂无符合条件的 IP 明细" />
        </template>
      </el-table>

      <WheelPagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        @change="emit('refresh')"
      />
    </div>
  </el-drawer>
</template>

<style scoped>
.ip-detail-drawer {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ip-detail-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
}

.ip-detail-summary-item {
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.ip-detail-summary-item span {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ip-detail-summary-item b {
  font-size: 18px;
  color: var(--el-text-color-primary);
}

.ip-detail-filter {
  padding: 14px 14px 0;
  background: var(--el-bg-color-page);
  border-radius: 6px;
}

.ip-detail-filter-control {
  width: 180px;
}

.ip-detail-filter-control--sm {
  width: 130px;
}
</style>
