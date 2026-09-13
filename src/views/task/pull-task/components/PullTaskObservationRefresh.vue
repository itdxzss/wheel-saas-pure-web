<script setup lang="ts">
import { onActivated, onDeactivated, onMounted, onUnmounted, ref } from "vue";
import { formatEpoch } from "../constants";

const props = defineProps<{
  visible: boolean;
  loading: boolean;
  refreshedAt: number | null;
  error: string;
}>();
const emit = defineEmits<{ refresh: []; "auto-refresh": [] }>();
const automatic = ref(true);
let timer: ReturnType<typeof setInterval> | undefined;
let active = true;

onActivated(() => {
  active = true;
});
onDeactivated(() => {
  active = false;
});

onMounted(() => {
  timer = setInterval(() => {
    if (
      active &&
      props.visible &&
      automatic.value &&
      !props.loading &&
      document.visibilityState === "visible"
    ) {
      emit("auto-refresh");
    }
  }, 10_000);
});
onUnmounted(() => clearInterval(timer));
</script>

<template>
  <div class="observation-refresh">
    <span>数据截至：{{ formatEpoch(refreshedAt) }}</span>
    <el-checkbox v-model="automatic">自动刷新（10 秒）</el-checkbox>
    <el-button size="small" :loading="loading" @click="emit('refresh')"
      >刷新</el-button
    >
    <span v-if="error" class="refresh-error" role="alert"
      >{{ error }}；当前数据可能已过期</span
    >
  </div>
</template>

<style scoped>
.observation-refresh {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.refresh-error {
  color: var(--el-color-warning);
}
</style>
