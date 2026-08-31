<script setup lang="ts">
import { computed } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import WheelPagination from "@/components/WheelPagination/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import type { TenantAccount } from "@/api/account";
import MoreFilled from "~icons/ep/more-filled";
import {
  accountStatusLabel,
  accountStatusTagType,
  accountTypeDeviceLabel,
  canDeleteAccount,
  loginStateLabel,
  loginStateTagType,
  riskStatusLabel,
  sourceLabel
} from "../account-display";
import { marketingOccupancyMeta } from "../marketing-occupancy";

defineOptions({
  name: "AccountListTable"
});

const props = defineProps<{
  columns: TableColumnList;
  batchOnlineCooldownRemaining: number;
  batchSubmitting: boolean;
  loading: boolean;
  onlineActionDisabled: (row: TenantAccount) => boolean;
  onlineActionLabel: (row: TenantAccount) => string;
  page: number;
  pageSize: number;
  rows: TenantAccount[];
  selectedCount: number;
  takeoverBatchDisabled: boolean;
  takeoverBatchTip: string;
  total: number;
  wsExporting: boolean;
}>();

const emit = defineEmits<{
  (event: "batch-command", command: string): void;
  (event: "group-click", row: TenantAccount): void;
  (event: "refresh"): void;
  (event: "row-action", row: TenantAccount, action: string): void;
  (event: "selection-change", rows: TenantAccount[]): void;
  (event: "update:page", value: number): void;
  (event: "update:pageSize", value: number): void;
}>();

const currentPage = computed({
  get: () => props.page,
  set: value => emit("update:page", value)
});
const currentPageSize = computed({
  get: () => props.pageSize,
  set: value => emit("update:pageSize", value)
});

function formatDate(value?: string | null) {
  if (!value) return "-";
  return value.replace("T", " ").slice(0, 19);
}

function avatarText(row: TenantAccount) {
  return row.nickname?.slice(0, 1) || row.ws_phone?.slice(-2) || "号";
}

/** 标签颜色完全由列表接口返回的展示类型决定，不在表格内请求任务详情。 */
function occupancyTagStyle(row: TenantAccount) {
  const { color } = marketingOccupancyMeta(row.marketing_occupancy_type);
  return {
    backgroundColor: color,
    borderColor: color,
    color: "#FFFFFF"
  };
}
</script>

<template>
  <PureTableBar title="账号列表" :columns="columns" @refresh="emit('refresh')">
    <template #buttons>
      <el-dropdown trigger="click" @command="emit('batch-command', $event)">
        <el-button
          :loading="batchSubmitting || wsExporting"
          :disabled="batchSubmitting || wsExporting"
          :icon="useRenderIcon(MoreFilled)"
        >
          批量操作
          <span v-if="selectedCount">({{ selectedCount }})</span>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="move-group">迁移到分组</el-dropdown-item>
            <el-dropdown-item
              command="online"
              :disabled="batchSubmitting || batchOnlineCooldownRemaining > 0"
            >
              <span v-if="batchOnlineCooldownRemaining > 0"
                >批量登录({{ batchOnlineCooldownRemaining }}s)</span
              >
              <span v-else>批量登录</span>
            </el-dropdown-item>
            <el-dropdown-item command="offline" :disabled="batchSubmitting">
              批量离线
            </el-dropdown-item>
            <el-dropdown-item
              command="takeover"
              :disabled="takeoverBatchDisabled"
              :title="takeoverBatchTip || undefined"
            >
              一键抢登
            </el-dropdown-item>
            <el-dropdown-item
              command="export-ws-phones"
              :disabled="selectedCount === 0 || batchSubmitting || wsExporting"
            >
              导出WS号
            </el-dropdown-item>
            <el-dropdown-item command="delete" divided
              >批量删除</el-dropdown-item
            >
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </template>

    <template #default="{ dynamicColumns }">
      <el-table
        v-loading="loading"
        :data="rows"
        row-key="id"
        border
        @selection-change="emit('selection-change', $event)"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column v-if="!dynamicColumns[0].hide" label="头像" width="82">
          <template #default="{ row }">
            <el-avatar v-if="row.avatar_url" :src="row.avatar_url" />
            <el-avatar v-else>{{ avatarText(row) }}</el-avatar>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[1].hide"
          label="账号"
          min-width="160"
        >
          <template #default="{ row }">
            <strong class="account-phone">
              <span v-if="row.country_flag" class="account-country-flag">
                {{ row.country_flag }}
              </span>
              {{ row.ws_phone || "-" }}
            </strong>
            <small>
              {{ row.assigned_service || row.service_name || "未绑定客服" }}
            </small>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[2].hide"
          label="分组"
          min-width="140"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <el-tag
              v-if="row.group_id"
              class="marketing-occupancy-tag"
              :style="occupancyTagStyle(row as TenantAccount)"
              @click="emit('group-click', row as TenantAccount)"
            >
              {{ row.group_name || "未命名分组" }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[3].hide"
          label="账号状态"
          width="120"
        >
          <template #default="{ row }">
            <el-tag size="small" :type="accountStatusTagType(row)">
              {{ accountStatusLabel(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[4].hide"
          label="登录"
          width="100"
        >
          <template #default="{ row }">
            <el-tag size="small" :type="loginStateTagType(row.login_state)">
              {{ loginStateLabel(row.login_state) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[5].hide"
          prop="ip_source"
          label="IP来源"
          min-width="140"
        />
        <el-table-column
          v-if="!dynamicColumns[6].hide"
          label="账号类型/设备"
          width="230"
        >
          <template #default="{ row }">
            {{ accountTypeDeviceLabel(row as TenantAccount) }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[7].hide"
          prop="protocol_address"
          label="协议"
          min-width="160"
          show-overflow-tooltip
        />
        <el-table-column
          v-if="!dynamicColumns[8].hide"
          prop="truth_ip"
          label="IP地址"
          min-width="160"
          show-overflow-tooltip
        />
        <el-table-column
          v-if="!dynamicColumns[9].hide"
          label="渠道/来源"
          min-width="150"
        >
          <template #default="{ row }">{{ sourceLabel(row) }}</template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[10].hide"
          label="风控"
          width="120"
        >
          <template #default="{ row }">
            {{ riskStatusLabel(row.risk_status) }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[11].hide"
          label="好友 / 群"
          width="120"
        >
          <template #default="{ row }">
            {{ row.friends_num ?? 0 }} / {{ row.groups_num ?? 0 }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[12].hide"
          prop="pull_into_group_count"
          label="拉人数量"
          width="110"
        />
        <el-table-column
          v-if="!dynamicColumns[13].hide"
          prop="hyperlink_sent_count"
          label="超链寿命"
          width="110"
        />
        <el-table-column
          v-if="!dynamicColumns[14].hide"
          prop="block_reason"
          label="封号错误码/封号原因"
          min-width="180"
          show-overflow-tooltip
        />
        <el-table-column
          v-if="!dynamicColumns[15].hide"
          label="入库时间"
          width="180"
        >
          <template #default="{ row }">
            {{ formatDate(row.first_login_time) }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[16].hide"
          label="失效时间"
          width="180"
        >
          <template #default="{ row }">
            {{ formatDate(row.invalidated_at) }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[17].hide"
          label="操作"
          fixed="right"
          width="210"
        >
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :disabled="
                row.login_state !== 1 &&
                onlineActionDisabled(row as TenantAccount)
              "
              @click="
                emit(
                  'row-action',
                  row as TenantAccount,
                  row.login_state === 1 ? '下线' : '上线'
                )
              "
            >
              {{ onlineActionLabel(row as TenantAccount) }}
            </el-button>
            <el-button
              link
              type="warning"
              disabled
              @click="emit('row-action', row as TenantAccount, '解除风控')"
            >
              解除风控
            </el-button>
            <el-button
              link
              type="danger"
              :disabled="!canDeleteAccount(row as TenantAccount)"
              @click="emit('row-action', row as TenantAccount, '删除')"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无账号数据，请在账号导入页面导入协议号。" />
        </template>
      </el-table>

      <WheelPagination
        v-model:current-page="currentPage"
        v-model:page-size="currentPageSize"
        :total="total"
        @change="emit('refresh')"
      />
    </template>
  </PureTableBar>
</template>

<style scoped>
.account-phone {
  display: flex;
  gap: 6px;
  align-items: center;
}

.account-country-flag {
  flex: none;
  font-size: 18px;
  line-height: 1;
}

small {
  display: block;
  margin-top: 4px;
  color: var(--el-text-color-secondary);
}

.marketing-occupancy-tag {
  max-width: 100%;
  color: #fff;
  cursor: pointer;
}
</style>
