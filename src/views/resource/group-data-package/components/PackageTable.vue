<script setup lang="ts">
import { computed } from "vue";
import { hasAuth } from "@/router/utils";
import Database from "~icons/ri/database-2-line";
import type {
  GroupDataPackage,
  GroupDataPackageCountry,
  GroupDataPackageExportFormat,
  GroupDataPackageExportStatus
} from "@/api/group-data-package";
import { formatEpochMillis } from "@/utils/time";
import {
  businessLabel,
  continentLabel,
  retryableCount,
  type PackageAction
} from "../domain/package-display";
import PackageExportMenu from "./PackageExportMenu.vue";
import PackageUsageCell from "./PackageUsageCell.vue";

defineOptions({ name: "GroupPackageTable" });
const canEdit = computed(() => hasAuth("tenant:group_data_package:edit"));
const canDelete = computed(() => hasAuth("tenant:group_data_package:delete"));
const props = defineProps<{
  rows: GroupDataPackage[];
  countries: GroupDataPackageCountry[];
  loading: boolean;
  columns: { prop?: string; hide?: boolean }[];
  busyId: number | null;
}>();
const emit = defineEmits<{
  (event: "select", rows: GroupDataPackage[]): void;
  (event: "action", action: PackageAction, row: GroupDataPackage): void;
  (
    event: "export",
    row: GroupDataPackage,
    status: GroupDataPackageExportStatus,
    format: GroupDataPackageExportFormat
  ): void;
}>();
function show(prop: string): boolean {
  return props.columns.find(item => item.prop === prop)?.hide !== true;
}
function countryLabel(iso2: string | null): string {
  if (!iso2) return "未识别";
  const name = props.countries.find(item => item.iso2 === iso2)?.nameZh;
  return name ? `${name} (${iso2})` : iso2;
}
</script>

<template>
  <el-table
    v-loading="loading"
    :data="rows"
    row-key="id"
    border
    size="small"
    @selection-change="value => emit('select', value)"
  >
    <el-table-column type="selection" fixed="left" width="42" />
    <el-table-column v-if="show('id')" label="ID" width="80" align="center"
      ><template #default="{ row }"
        ><span class="muted">#{{ row.id }}</span></template
      ></el-table-column
    >
    <el-table-column v-if="show('name')" label="数据包" width="220">
      <template #default="{ row }"
        ><div class="package-identity">
          <span class="package-icon"
            ><el-icon><Database /></el-icon
          ></span>
          <div class="package-copy">
            <strong :title="row.name">{{ row.name }}</strong
            ><span :title="row.remark || ''">{{
              row.remark || "暂无备注"
            }}</span>
          </div>
        </div></template
      >
    </el-table-column>
    <el-table-column
      v-if="show('country')"
      label="国家"
      width="110"
      align="center"
      ><template #default="{ row }">{{
        countryLabel(row.primaryCountryIso2)
      }}</template></el-table-column
    >
    <el-table-column
      v-if="show('continent')"
      label="大洲"
      width="90"
      align="center"
      ><template #default="{ row }">{{
        continentLabel(row.continent)
      }}</template></el-table-column
    >
    <el-table-column v-if="show('businesses')" label="消费业务" width="150">
      <template #header
        ><el-tooltip
          content="根据实际领取号码的任务记录统计；尚未被任务取用时为空。"
          ><span>消费业务 ⓘ</span></el-tooltip
        ></template
      >
      <template #default="{ row }"
        ><el-tag
          v-for="business in row.usageBusinesses"
          :key="business"
          round
          size="small"
          >{{ businessLabel(business) }}</el-tag
        ><span v-if="!row.usageBusinesses.length" class="muted"
          >—</span
        ></template
      >
    </el-table-column>
    <el-table-column v-if="show('usage')" label="号码使用情况" min-width="280">
      <template #header
        ><el-tooltip
          content="总量为包内当前号码总数；已使用 = 总量 − 未用，包含已领取与待确认。失败包含可重试失败、隐私拒绝和未注册。待确认不会自动重置。"
          ><span>号码使用情况 ⓘ</span></el-tooltip
        ></template
      >
      <template #default="{ row }"
        ><PackageUsageCell :metrics="row.metrics"
      /></template>
    </el-table-column>
    <el-table-column
      v-if="show('clicks')"
      label="点击 / 点击率"
      width="150"
      align="center"
    >
      <template #default
        ><el-tooltip
          content="点击统计与访问趋势后续接入；当前没有与拉群数据包关联的点击结果。"
          ><span class="muted">待接入</span></el-tooltip
        ></template
      >
    </el-table-column>
    <el-table-column
      v-if="show('exportable')"
      label="可导出"
      width="100"
      align="center"
    >
      <template #default="{ row }"
        ><el-tag
          :type="row.metrics.totalCount ? 'success' : 'info'"
          round
          size="small"
          >{{ row.metrics.totalCount ? "可导出" : "空包" }}</el-tag
        ></template
      >
    </el-table-column>
    <el-table-column
      v-if="show('createdAt')"
      label="创建时间"
      width="175"
      align="center"
      ><template #default="{ row }">{{
        formatEpochMillis(row.createdAt)
      }}</template></el-table-column
    >
    <el-table-column label="操作" width="290" fixed="right" align="center">
      <template #default="{ row }"
        ><div class="row-actions">
          <PackageExportMenu
            :metrics="row.metrics"
            :disabled="row.metrics.totalCount === 0 || busyId !== null"
            :loading="busyId === row.id"
            @export="(status, format) => emit('export', row, status, format)"
          />
          <el-button
            v-auth="'tenant:group_data_package:import'"
            type="success"
            plain
            size="small"
            :disabled="busyId !== null"
            @click="emit('action', 'import', row)"
            >导入</el-button
          >
          <el-dropdown
            v-auth="'tenant:group_data_package:view'"
            trigger="click"
            @command="value => emit('action', value, row)"
          >
            <el-button size="small">详情 ▾</el-button
            ><template #dropdown
              ><el-dropdown-menu
                ><el-dropdown-item command="phones">查看号码</el-dropdown-item
                ><el-dropdown-item command="imports"
                  >导入记录</el-dropdown-item
                ></el-dropdown-menu
              ></template
            >
          </el-dropdown>
          <el-dropdown
            v-if="canEdit || canDelete"
            trigger="click"
            @command="value => emit('action', value, row)"
          >
            <el-button size="small" :disabled="busyId !== null"
              >更多 ▾</el-button
            >
            <template #dropdown
              ><el-dropdown-menu>
                <el-dropdown-item v-if="canEdit" command="edit"
                  >编辑</el-dropdown-item
                >
                <el-dropdown-item
                  v-if="canEdit"
                  command="reset"
                  :disabled="retryableCount(row.metrics) === 0"
                  :title="`可重置 ${retryableCount(row.metrics)} 条；隐私拒绝、未注册和待确认不重置，任务占用时不能操作。`"
                  >重置失败（{{
                    retryableCount(row.metrics)
                  }}）</el-dropdown-item
                >
                <el-dropdown-item v-if="canDelete" command="delete" divided
                  >删除</el-dropdown-item
                >
              </el-dropdown-menu></template
            >
          </el-dropdown>
        </div></template
      >
    </el-table-column>
    <template #empty
      ><el-empty description="暂无符合条件的拉群数据包"
    /></template>
  </el-table>
</template>

<style scoped>
.muted {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.package-identity {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.package-icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 32px;
  height: 32px;
  font-size: 22px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 8px;
}

.package-copy {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.package-copy strong,
.package-copy span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.package-copy span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.row-actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  align-items: center;
  justify-content: center;
}

.row-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}
</style>
