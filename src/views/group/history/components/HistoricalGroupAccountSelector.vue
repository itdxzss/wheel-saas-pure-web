<script setup lang="ts">
import type { AccountGroupApiRow } from "@/api/account-group";

defineOptions({
  name: "HistoricalGroupAccountSelector"
});

defineProps<{
  accountGroups: AccountGroupApiRow[];
  accountGroupsLoading: boolean;
  refreshing: boolean;
  selectedAccountGroupId: number | null;
}>();

const emit = defineEmits<{
  (event: "account-group-change", value: number | null): void;
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
          placeholder="请选择账号分组"
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

      <el-form-item label="当前群状态">
        <el-button
          type="primary"
          :disabled="!selectedAccountGroupId"
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
      title="选择账号分组后立即展示历史数据；点击“加载群列表”会从 WhatsApp 同步最新群信息。"
    />
  </el-card>
</template>

<style scoped>
.historical-group-selector {
  margin-bottom: 16px;
}

.historical-group-selector :deep(.el-form-item) {
  min-width: 260px;
  margin-bottom: 12px;
}

.historical-group-selector :deep(.el-select) {
  width: 260px;
}
</style>
