<script setup lang="ts">
import type { AccountGroupApiRow } from "@/api/account-group";
import type { HistoricalGroupAccountOption } from "../composables/useHistoricalGroupPage";

defineOptions({
  name: "HistoricalGroupAccountSelector"
});

defineProps<{
  accountGroups: AccountGroupApiRow[];
  accountGroupsLoading: boolean;
  accounts: HistoricalGroupAccountOption[];
  accountsLoading: boolean;
  baselineLoading: boolean;
  refreshing: boolean;
  selectedAccountGroupId: number | null;
  selectedAccountId: number | null;
}>();

const emit = defineEmits<{
  (event: "account-group-change", value: number | null): void;
  (event: "account-change", value: number | null): void;
  (event: "load"): void;
}>();
</script>

<template>
  <el-card shadow="never" class="historical-group-selector">
    <el-form inline label-position="top">
      <el-form-item label="账号分组" required>
        <el-select
          :model-value="selectedAccountGroupId"
          :loading="accountGroupsLoading"
          clearable
          filterable
          placeholder="请先选择账号分组"
          @change="emit('account-group-change', $event ?? null)"
        >
          <el-option
            v-for="group in accountGroups"
            :key="group.id"
            :label="`${group.name}（${group.totalAccounts} 个账号）`"
            :value="group.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="操作账号" required>
        <el-select
          :model-value="selectedAccountId"
          :disabled="!selectedAccountGroupId"
          :loading="accountsLoading"
          clearable
          filterable
          placeholder="选择固定操作账号"
          @change="emit('account-change', $event ?? null)"
        >
          <el-option
            v-for="account in accounts"
            :key="account.id"
            :label="account.label"
            :value="account.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="当前群状态">
        <el-button
          type="primary"
          :disabled="!selectedAccountId || baselineLoading"
          :loading="refreshing"
          @click="emit('load')"
        >
          加载群列表
        </el-button>
      </el-form-item>
    </el-form>
    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="选择操作账号后先展示 baseline；只有点击“加载群列表”才刷新当前在群状态。"
    />
  </el-card>
</template>

<style scoped>
.historical-group-selector {
  margin-bottom: 16px;
}

.historical-group-selector :deep(.el-form-item) {
  margin-bottom: 12px;
  min-width: 260px;
}

.historical-group-selector :deep(.el-select) {
  width: 260px;
}
</style>
