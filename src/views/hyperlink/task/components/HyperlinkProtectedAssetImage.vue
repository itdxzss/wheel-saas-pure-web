<script setup lang="ts">
import { computed, watch } from "vue";
import { useProtectedAssetUrl } from "../composables/useProtectedAssetUrl";

defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    assetId: number | null;
    fit?: "fill" | "contain" | "cover" | "none" | "scale-down";
  }>(),
  { fit: "cover" }
);
const emit = defineEmits<{ (event: "error", message: string): void }>();
const { url, loading, error } = useProtectedAssetUrl(
  computed(() => props.assetId)
);

watch(error, message => {
  if (message) emit("error", message);
});
</script>

<template>
  <div v-bind="$attrs" class="protected-asset-image">
    <el-image v-if="url" :src="url" :fit="fit" class="protected-image" />
    <el-skeleton v-else-if="loading" animated class="protected-placeholder">
      <template #template><el-skeleton-item variant="image" /></template>
    </el-skeleton>
    <div v-else class="protected-placeholder">
      {{ error || "图片不可用" }}
    </div>
  </div>
</template>

<style scoped>
.protected-asset-image,
.protected-image,
.protected-placeholder,
.protected-placeholder :deep(.el-skeleton__item) {
  width: 100%;
  height: 100%;
}

.protected-placeholder {
  display: grid;
  place-content: center;
  padding: 8px;
  color: var(--el-text-color-secondary);
  text-align: center;
  background: var(--el-fill-color-light);
}
</style>
