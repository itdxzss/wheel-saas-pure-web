<script setup lang="ts">
import { ref, watch } from "vue";
import {
  getHyperlinkBanStats,
  type HyperlinkBanStats
} from "@/api/hyperlink-task-analysis";
import { apiErrorMessage } from "@/utils/api-error";

defineOptions({ name: "HyperlinkBanReasonStatsTab" });
const props = defineProps<{ taskId: number }>();
const loading = ref(false);
const errorMessage = ref("");
const result = ref<HyperlinkBanStats | null>(null);
const colors = [
  "#e6a23c",
  "#f56c6c",
  "#409eff",
  "#67c23a",
  "#9b59b6",
  "#f08a24"
];
let requestSequence = 0;

watch(
  () => props.taskId,
  () => void load(),
  { immediate: true }
);

async function load(): Promise<void> {
  const sequence = ++requestSequence;
  loading.value = true;
  try {
    const data = await getHyperlinkBanStats(props.taskId);
    if (sequence !== requestSequence) return;
    result.value = data;
    errorMessage.value = "";
  } catch (error) {
    if (sequence !== requestSequence) return;
    result.value = null;
    errorMessage.value = apiErrorMessage(error, "封号原因加载失败");
  } finally {
    if (sequence === requestSequence) loading.value = false;
  }
}
</script>

<template>
  <section v-loading="loading" class="ban-stats-tab">
    <el-alert
      v-if="errorMessage"
      type="error"
      show-icon
      :closable="false"
      :title="errorMessage"
    >
      <el-button link type="primary" @click="load">重试</el-button>
    </el-alert>
    <div class="summary-line">
      封号总数 <strong>{{ result?.invalidAccountCount ?? 0 }}</strong>
      <el-button link type="primary" @click="load">刷新</el-button>
    </div>
    <el-empty
      v-if="result && !result.stats.length"
      description="该任务暂无封号记录"
    />
    <div v-else class="reason-list">
      <el-card
        v-for="(item, index) in result?.stats ?? []"
        :key="item.reason"
        shadow="never"
      >
        <div class="reason-header">
          <el-tooltip :content="item.reason" placement="top">
            <strong class="reason-name">{{ item.reason }}</strong>
          </el-tooltip>
          <span
            >{{ item.count }} 个账号 · {{ item.percentage.toFixed(1) }}%</span
          >
        </div>
        <div v-if="item.note" class="reason-note">{{ item.note }}</div>
        <el-progress
          :percentage="item.percentage"
          :color="colors[index % colors.length]"
          :stroke-width="10"
        />
      </el-card>
    </div>
  </section>
</template>

<style scoped>
.ban-stats-tab {
  min-height: 420px;
  padding-top: 12px;
}

.summary-line {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.summary-line strong {
  font-size: 20px;
  color: var(--el-color-danger);
}

.summary-line .el-button {
  margin-left: auto;
}

.reason-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 12px;
}

.reason-header {
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-bottom: 8px;
}

.reason-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reason-note {
  margin-bottom: 10px;
  color: var(--el-text-color-secondary);
}

@media (width <= 900px) {
  .reason-list {
    grid-template-columns: 1fr;
  }
}
</style>
