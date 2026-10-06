<script setup lang="ts">
import { computed } from "vue";
import type { GroupMarketingCreateForm } from "../composables/useGroupMarketingTaskPage";

defineOptions({
  name: "MarketingNewGroupDelayConfig"
});

const form = defineModel<GroupMarketingCreateForm>({ required: true });
const unitText = computed(() =>
  form.value.newGroupDelayUnit === "MINUTE" ? "分钟" : "小时"
);
</script>

<template>
  <div class="new-group-delay-card">
    <div class="new-group-delay-header">
      <span>首次发送延迟</span>
      <el-switch
        v-model="form.newGroupDelayEnabled"
        aria-label="首次发送延迟开关"
        active-text="开启"
      />
    </div>
    <template v-if="form.newGroupDelayEnabled">
      <el-divider />
      <div class="new-group-delay-control">
        <span class="new-group-delay-label">延迟时长</span>
        <el-input-number
          v-model="form.newGroupDelayValue"
          :min="1"
          :step="1"
          :precision="0"
          aria-label="首次发送延迟时长"
          controls-position="right"
        />
        <el-select
          v-model="form.newGroupDelayUnit"
          aria-label="首次发送延迟时间单位"
          class="new-group-delay-unit"
        >
          <el-option label="分钟" value="MINUTE" />
          <el-option label="小时" value="HOUR" />
        </el-select>
      </div>
      <p class="new-group-delay-summary">
        每个群组首次发送前等待 {{ form.newGroupDelayValue }} {{ unitText }}
      </p>
      <p class="new-group-delay-note">
        已有群组从任务启动时开始计时，启动后新检测到的群组从检测时开始计时；首次发送后，后续发送跟随任务轮次。
      </p>
    </template>
  </div>
</template>

<style scoped>
.new-group-delay-card {
  box-sizing: border-box;
  padding: 18px 20px;
  margin: 0 0 18px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.new-group-delay-header,
.new-group-delay-control {
  display: flex;
  gap: 12px;
  align-items: center;
}

.new-group-delay-header {
  color: var(--el-text-color-regular);
}

.new-group-delay-card :deep(.el-divider) {
  margin: 18px 0;
}

.new-group-delay-label {
  width: 120px;
  color: var(--el-text-color-regular);
}

.new-group-delay-unit {
  width: 136px;
}

.new-group-delay-summary,
.new-group-delay-note {
  margin: 18px 0 0;
}

.new-group-delay-summary {
  color: var(--el-text-color-primary);
}

.new-group-delay-note {
  color: var(--el-text-color-secondary);
}
</style>
