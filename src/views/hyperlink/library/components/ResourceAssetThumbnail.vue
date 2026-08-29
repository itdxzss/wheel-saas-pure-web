<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import { downloadResourceAsset } from "@/api/resource-asset";

const props = withDefaults(
  defineProps<{
    assetId: number;
    alt?: string;
    fit?: "cover" | "contain";
  }>(),
  { alt: "图片素材", fit: "cover" }
);

const objectUrl = ref("");
const loading = ref(false);
const failed = ref(false);
let requestId = 0;

function revoke(): void {
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value);
  objectUrl.value = "";
}

async function load(): Promise<void> {
  const current = ++requestId;
  revoke();
  failed.value = false;
  loading.value = true;
  try {
    const blob = await downloadResourceAsset(props.assetId);
    if (current !== requestId) return;
    objectUrl.value = URL.createObjectURL(blob);
  } catch {
    if (current === requestId) failed.value = true;
  } finally {
    if (current === requestId) loading.value = false;
  }
}

watch(() => props.assetId, load, { immediate: true });

onBeforeUnmount(() => {
  requestId += 1;
  revoke();
});
</script>

<template>
  <div v-loading="loading" class="asset-thumbnail">
    <el-image
      v-if="objectUrl"
      :src="objectUrl"
      :alt="alt"
      :fit="fit"
      lazy
      class="asset-thumbnail__image"
    />
    <el-empty
      v-else
      :image-size="42"
      :description="failed ? '加载失败' : '加载中'"
    />
  </div>
</template>

<style scoped>
.asset-thumbnail,
.asset-thumbnail__image {
  width: 100%;
  height: 100%;
}

.asset-thumbnail {
  overflow: hidden;
  background: var(--el-fill-color-light);
}
</style>
