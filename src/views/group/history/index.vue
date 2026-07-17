<script setup lang="ts">
import { onMounted } from "vue";
import HistoricalGroupAccountSelector from "./components/HistoricalGroupAccountSelector.vue";
import HistoricalGroupDetailDrawer from "./components/HistoricalGroupDetailDrawer.vue";
import HistoricalGroupTable from "./components/HistoricalGroupTable.vue";
import { useHistoricalGroupPage } from "./composables/useHistoricalGroupPage";

defineOptions({
  name: "HistoricalGroupManagement"
});

const page = useHistoricalGroupPage();

onMounted(() => {
  void page.loadAccountGroups();
});
</script>

<template>
  <div class="historical-group-page">
    <HistoricalGroupAccountSelector
      :account-groups="page.accountGroups.value"
      :account-groups-loading="page.accountGroupsLoading.value"
      :accounts="page.accounts.value"
      :accounts-loading="page.accountsLoading.value"
      :baseline-loading="page.baselineLoading.value"
      :refreshing="page.refreshing.value"
      :selected-account-group-id="page.selectedAccountGroupId.value"
      :selected-account-id="page.selectedAccountId.value"
      @account-group-change="page.selectAccountGroup"
      @account-change="page.selectOperationAccount"
      @load="page.refreshHistoricalGroups"
    />

    <HistoricalGroupTable
      :loading="page.baselineLoading.value || page.refreshing.value"
      :sections="page.sections.value"
      :selected-account-id="page.selectedAccountId.value"
      @open-detail="page.openGroup"
    />

    <HistoricalGroupDetailDrawer
      :model-value="Boolean(page.activeGroup.value)"
      :group="page.activeGroup.value"
      :operation-account-id="page.selectedAccountId.value"
      @update:model-value="visible => !visible && page.closeGroup()"
    />
  </div>
</template>

<style scoped>
.historical-group-page {
  padding: 16px;
}
</style>
