<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import {
  downloadResourceAsset,
  type ResourceAssetScope
} from "@/api/resource-asset";

const props = withDefaults(
  defineProps<{
    assetId: number;
    scope?: ResourceAssetScope;
    alt?: string;
    fit?: "cover" | "contain";
    preview?: boolean;
  }>(),
  { alt: "图片素材", fit: "cover", preview: false, scope: "HYPERLINK" }
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
    const blob = await downloadResourceAsset(props.assetId, props.scope);
    if (current !== requestId) return;
    objectUrl.value = URL.createObjectURL(blob);
  } catch {
    if (current === requestId) failed.value = true;
  } finally {
    if (current === requestId) loading.value = false;
  }
}

watch(() => [props.assetId, props.scope], load, { immediate: true });

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
      :preview-src-list="preview ? [objectUrl] : []"
      preview-teleported
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
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--el-fill-color-light);
}

.asset-thumbnail :deep(.el-empty) {
  padding: 0;
}
</style>
