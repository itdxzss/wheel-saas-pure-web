<script setup lang="ts">
import { resolveAccountGroupLabel } from "@/utils/account-group-label";
import { ElMessageBox } from "element-plus";
import type { AccountGroupApiRow } from "@/api/account-group";
import type {
  AccountRegistrationDetail,
  AccountRegistrationTask
} from "@/api/account-registration";
import { formatEpochMillis } from "@/utils/time";
import {
  canCancelRegistration,
  registrationActualCost,
  registrationFailureLabel,
  registrationStateLabel,
  registrationTagType
} from "../registration-display";

const props = defineProps<{
  rows: AccountRegistrationTask[];
  detail: AccountRegistrationDetail | null;
  groups: AccountGroupApiRow[];
  countries: Array<{ id: string; name: string }>;
  loading: boolean;
  detailLoading: boolean;
  cancelling: boolean;
  page: number;
  pageSize: number;
  total: number;
}>();
const emit = defineEmits<{
  (event: "refresh"): void;
  (event: "detail", id: number): void;
  (event: "cancel", id: number): void;
  (event: "update:page", value: number): void;
  (event: "update:pageSize", value: number): void;
}>();

function groupName(id: number): string {
  return resolveAccountGroupLabel(props.groups, id);
}

function countryName(id: string): string {
  return props.countries.find(country => country.id === id)?.name ?? id;
}

async function cancel(task: AccountRegistrationTask): Promise<void> {
  try {
    await ElMessageBox.confirm(
      "只停止尚未采购的号码。已经采购的号码会继续收码、注册和归档，失败不补购。",
      "停止未采购项",
      {
        type: "warning",
        confirmButtonText: "确认停止",
        cancelButtonText: "返回"
      }
    );
    emit("cancel", task.id);
  } catch (error) {
    if (error !== "cancel" && error !== "close") throw error;
  }
}
</script>

<template>
  <div class="tasks-toolbar">
    <span>页面打开时每 5 秒刷新</span>
    <el-button :loading="loading" @click="emit('refresh')">刷新任务</el-button>
  </div>
  <el-table v-loading="loading" :data="rows" row-key="id" border>
    <el-table-column prop="id" label="任务 ID" width="95" />
    <el-table-column label="美国渠道 / 单价" min-width="160">
      <template #default="{ row }"
        >{{ countryName(row.countryId) }} · 商家
        {{ row.providerId || "自动分配" }}<br />{{ row.unitPrice }} 美元（USD）/
        号码</template
      >
    </el-table-column>
    <el-table-column label="目标分组" min-width="120"
      ><template #default="{ row }">{{
        groupName(row.accountGroupId)
      }}</template></el-table-column
    >
    <el-table-column prop="quantity" label="采购数" width="80" />
    <el-table-column label="成功 / 失败 / 待核对" min-width="165"
      ><template #default="{ row }"
        >{{ row.counts.succeeded }} / {{ row.counts.failed }} /
        {{ row.counts.unknown }}</template
      ></el-table-column
    >
    <el-table-column label="状态" min-width="115"
      ><template #default="{ row }"
        ><el-tag :type="registrationTagType(row.status)">{{
          registrationStateLabel(row.status)
        }}</el-tag>
        <div v-if="row.cancelRequested">已申请停止</div></template
      ></el-table-column
    >
    <el-table-column label="操作" fixed="right" width="165"
      ><template #default="{ row }">
        <el-button link type="primary" @click="emit('detail', row.id)"
          >明细</el-button
        >
        <el-button
          v-if="canCancelRegistration(row)"
          v-perms="['tenant:account:edit']"
          link
          type="danger"
          :loading="cancelling"
          @click="cancel(row)"
          >停止未采购</el-button
        >
      </template></el-table-column
    >
    <template #empty><el-empty description="暂无新号注册任务" /></template>
  </el-table>
  <el-pagination
    class="mt-4"
    :current-page="page"
    :page-size="pageSize"
    :page-sizes="[10, 20, 50]"
    :total="total"
    layout="total, sizes, prev, pager, next"
    @update:current-page="emit('update:page', $event)"
    @update:page-size="emit('update:pageSize', $event)"
    @change="emit('refresh')"
  />

  <section v-if="detail" v-loading="detailLoading" class="task-detail">
    <div class="tasks-toolbar">
      <h3>任务 #{{ detail.task.id }} 明细</h3>
      <el-button
        :loading="detailLoading"
        @click="emit('detail', detail.task.id)"
        >刷新明细</el-button
      >
    </div>
    <el-descriptions :column="2" border class="mb-4">
      <el-descriptions-item label="目标分组">{{
        groupName(detail.task.accountGroupId)
      }}</el-descriptions-item>
      <el-descriptions-item label="账号类型">{{
        detail.task.accountType === 1 ? "个人" : "商业"
      }}</el-descriptions-item>
      <el-descriptions-item label="采购数量"
        >{{ detail.task.quantity }}（失败不补购）</el-descriptions-item
      >
      <el-descriptions-item label="成功 / 失败 / 待核对"
        >{{ detail.task.counts.succeeded }} / {{ detail.task.counts.failed }} /
        {{ detail.task.counts.unknown }}</el-descriptions-item
      >
      <el-descriptions-item label="待执行 / 处理中 / 已取消"
        >{{ detail.task.counts.pending }} /
        {{ detail.task.counts.processing }} /
        {{ detail.task.counts.cancelled }}</el-descriptions-item
      >
      <el-descriptions-item label="创建时间">{{
        formatEpochMillis(detail.task.createdAt)
      }}</el-descriptions-item>
    </el-descriptions>
    <el-alert
      v-if="detail.task.counts.unknown > 0"
      type="warning"
      :closable="false"
      title="待核对项的外部结果尚未确认，不会自动补购或重放采购。"
      class="mb-4"
    />
    <el-table :data="detail.items" row-key="id" border>
      <el-table-column prop="ordinal" label="序号" width="70" />
      <el-table-column prop="phoneNumber" label="号码" min-width="145"
        ><template #default="{ row }">{{
          row.phoneNumber || "尚未取号"
        }}</template></el-table-column
      >
      <el-table-column label="执行状态" min-width="120"
        ><template #default="{ row }"
          ><el-tag :type="registrationTagType(row.state)">{{
            registrationStateLabel(row.state)
          }}</el-tag></template
        ></el-table-column
      >
      <el-table-column label="取号尝试" min-width="120">
        <template #default="{ row }"
          >{{ row.purchaseAttempts ?? 0 }} / 50</template
        >
      </el-table-column>
      <el-table-column label="成交费用（美元）" min-width="160"
        ><template #default="{ row }">{{
          registrationActualCost(row.actualCost)
        }}</template></el-table-column
      >
      <el-table-column
        prop="activationId"
        label="接码订单"
        min-width="120"
        show-overflow-tooltip
      />
      <el-table-column prop="accountId" label="账号 ID" width="100" />
      <el-table-column prop="importBatchId" label="导入批次" width="100" />
      <el-table-column label="执行说明" min-width="230" show-overflow-tooltip
        ><template #default="{ row }">{{
          registrationFailureLabel(row.failureCode)
        }}</template></el-table-column
      >
      <el-table-column label="更新时间" min-width="175"
        ><template #default="{ row }">{{
          formatEpochMillis(row.updatedAt)
        }}</template></el-table-column
      >
    </el-table>
  </section>
</template>

<style scoped>
.tasks-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.tasks-toolbar > span {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.task-detail {
  margin-top: 28px;
}
</style>
