<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { getResourceAsset, type ResourceAsset } from "@/api/resource-asset";
import { apiErrorMessage } from "@/utils/api-error";
import ResourceAssetPicker from "./ResourceAssetPicker.vue";
import ResourceAssetThumbnail from "./ResourceAssetThumbnail.vue";

const assetId = defineModel<number | null>({ required: true });
const asset = ref<ResourceAsset | null>(null);
const pickerVisible = ref(false);
let requestId = 0;

async function restore(id: number | null): Promise<void> {
  if (asset.value?.id === id) return;
  const current = ++requestId;
  asset.value = null;
  if (id == null) return;
  try {
    const detail = await getResourceAsset(id);
    if (current === requestId) asset.value = detail;
  } catch (error) {
    if (current === requestId) {
      ElMessage.error(apiErrorMessage(error, "素材信息加载失败"));
    }
  }
}

function select(selected: ResourceAsset): void {
  asset.value = selected;
  assetId.value = selected.id;
}

function clear(): void {
  asset.value = null;
  assetId.value = null;
}

watch(assetId, restore, { immediate: true });
</script>

<template>
  <div class="resource-asset-field">
    <el-button type="primary" plain @click="pickerVisible = true">
      从素材库选择
    </el-button>
    <div v-if="asset" class="selected-asset">
      <div class="selected-thumbnail">
        <ResourceAssetThumbnail :asset-id="asset.id" :alt="asset.assetName" />
      </div>
      <div class="selected-meta">
        <strong>{{ asset.assetName }}</strong>
        <span>#{{ asset.id }}</span>
      </div>
      <el-button link type="danger" @click="clear">移除图片</el-button>
    </div>
    <ResourceAssetPicker
      v-model="pickerVisible"
      :selected-asset="asset"
      @select="select"
    />
  </div>
</template>

<style scoped>
.resource-asset-field {
  width: 100%;
}

.selected-asset {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px;
  margin-top: 10px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
}

.selected-thumbnail {
  width: 96px;
  aspect-ratio: 5 / 4;
  overflow: hidden;
  border-radius: 6px;
}

.selected-meta {
  display: grid;
  flex: 1;
  gap: 4px;
}

.selected-meta span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
