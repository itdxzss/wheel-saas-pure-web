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
      :refreshing="page.refreshing.value"
      :selected-account-group-id="page.selectedAccountGroupId.value"
      @account-group-change="page.selectAccountGroup"
      @load="page.refreshHistoricalGroups"
    />

    <HistoricalGroupTable
      :loading="page.baselineLoading.value || page.refreshing.value"
      :account-group-selected="page.selectedAccountGroupId.value != null"
      :rows="page.rows.value"
      @open-detail="page.openGroup"
    />

    <el-pagination
      v-if="page.selectedAccountGroupId.value != null && page.total.value > 0"
      class="historical-group-pagination"
      background
      layout="total, prev, pager, next"
      :current-page="page.page.value"
      :page-size="page.pageSize.value"
      :total="page.total.value"
      @current-change="page.changePage"
    />

    <HistoricalGroupDetailDrawer
      :model-value="Boolean(page.activeGroup.value)"
      :group="page.activeGroup.value"
      :account-group-id="page.selectedAccountGroupId.value"
      @update:model-value="visible => !visible && page.closeGroup()"
    />
  </div>
</template>

<style scoped>
.historical-group-page {
  padding: 16px;
}

.historical-group-pagination {
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
