<script setup lang="ts">
import type { HyperlinkAccountStatItem } from "@/api/hyperlink-task-account-stats";

defineOptions({ name: "AccountStatAccountCell" });

defineProps<{
  row: HyperlinkAccountStatItem;
}>();
</script>

<template>
  <div
    v-if="row.accountId == null"
    class="account-cell account-cell--unassigned"
  >
    <strong>未分配</strong>
    <small>尚未绑定发信账号</small>
  </div>
  <div v-else class="account-cell">
    <strong>{{ row.senderPhone || `账号 #${row.accountId}` }}</strong>
    <small>ID {{ row.accountId }}</small>
  </div>
</template>

<style scoped>
.account-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.account-cell strong {
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
  white-space: nowrap;
}

.account-cell small {
  color: var(--el-text-color-secondary);
}

.account-cell--unassigned strong {
  color: var(--el-color-warning);
}
</style>
