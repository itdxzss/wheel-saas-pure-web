<script setup lang="ts">
import type { SmsActivation } from "@/api/sms-activation";
import { formatEpochMillis } from "@/utils/time";
import {
  registrationFailureLabel,
  registrationAccountTypeLabel,
  registrationLabel,
  registrationTag,
  smsStateLabel,
  smsStateTag
} from "../sms-activation-display";

defineProps<{
  rows: SmsActivation[];
  total: number;
  loading: boolean;
}>();
const page = defineModel<number>("page", { required: true });
const pageSize = defineModel<number>("pageSize", { required: true });
const emit = defineEmits<{ (event: "change"): void }>();
</script>

<template>
  <el-table v-loading="loading" :data="rows" border>
    <el-table-column label="号码" min-width="150">
      <template #default="{ row }">+{{ row.phoneNumber }}</template>
    </el-table-column>
    <el-table-column prop="countryId" label="渠道" width="80" />
    <el-table-column prop="cost" label="花费" width="100" />
    <el-table-column label="状态" width="100">
      <template #default="{ row }">
        <el-tag :type="smsStateTag(row.state)">{{
          smsStateLabel(row.state)
        }}</el-tag>
      </template>
    </el-table-column>
    <el-table-column label="验证码" width="110">
      <template #default="{ row }">{{ row.smsCode || "-" }}</template>
    </el-table-column>
    <el-table-column label="注册" min-width="150">
      <template #default="{ row }">
        <template v-if="row.registrationState">
          <div>
            {{ registrationAccountTypeLabel(row.registrationAccountType) }}
          </div>
          <el-tag :type="registrationTag(row.registrationState)" size="small">{{
            registrationLabel(row.registrationState)
          }}</el-tag>
          <div v-if="row.registrationFailure" class="records-failure">
            {{ registrationFailureLabel(row.registrationFailure) }}
          </div>
        </template>
        <template v-else>-</template>
      </template>
    </el-table-column>
    <el-table-column label="取号时间" min-width="170">
      <template #default="{ row }">{{
        formatEpochMillis(row.createdAt)
      }}</template>
    </el-table-column>
    <el-table-column prop="createdBy" label="操作人ID" width="100" />
  </el-table>
  <el-pagination
    v-model:current-page="page"
    v-model:page-size="pageSize"
    class="records-pager"
    layout="total, sizes, prev, pager, next"
    :page-sizes="[10, 20, 50]"
    :total="total"
    @current-change="emit('change')"
    @size-change="emit('change')"
  />
</template>

<style scoped>
.records-failure {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-color-danger);
}

.records-pager {
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
