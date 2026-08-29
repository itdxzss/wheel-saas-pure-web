<script setup lang="ts">
import { ref } from "vue";
import AttributionTab from "./AttributionTab.vue";
import VisitTrendTab from "./VisitTrendTab.vue";
import BanReasonStatsTab from "./BanReasonStatsTab.vue";

defineOptions({ name: "HyperlinkAttributionTabs" });
defineProps<{ taskId: number; successNum: number }>();
const activeTab = ref<"attribution" | "trend" | "ban">("attribution");
</script>

<template>
  <el-tabs v-model="activeTab" class="hyperlink-attribution-tabs">
    <el-tab-pane label="深度归因" name="attribution" lazy>
      <AttributionTab :task-id="taskId" :success-num="successNum" />
    </el-tab-pane>
    <el-tab-pane label="访问趋势" name="trend" lazy>
      <VisitTrendTab :task-id="taskId" />
    </el-tab-pane>
    <el-tab-pane label="封号原因" name="ban" lazy>
      <BanReasonStatsTab :task-id="taskId" />
    </el-tab-pane>
  </el-tabs>
</template>

<style scoped>
.hyperlink-attribution-tabs {
  width: 100%;
  min-width: 0;
}
</style>
