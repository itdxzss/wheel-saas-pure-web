<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  listResourceAssets,
  listResourceAssetTags,
  type ResourceAsset
} from "@/api/resource-asset";
import { apiErrorMessage } from "@/utils/api-error";
import WheelPagination from "@/components/WheelPagination/index.vue";
import { formatAssetBytes } from "../domain/resource-asset";
import ResourceAssetThumbnail from "./ResourceAssetThumbnail.vue";
import ResourceAssetUploadDialog from "./ResourceAssetUploadDialog.vue";

const visible = defineModel<boolean>({ required: true });
const props = defineProps<{ selectedAsset: ResourceAsset | null }>();
const emit = defineEmits<{ (event: "select", asset: ResourceAsset): void }>();

const rows = ref<ResourceAsset[]>([]);
const tags = ref<string[]>([]);
const selectedTags = ref<string[]>([]);
const keyword = ref("");
const page = ref(1);
const pageSize = ref<12 | 24 | 48 | 96>(12);
const total = ref(0);
const loading = ref(false);
const uploadVisible = ref(false);
const pendingSelection = ref<ResourceAsset | null>(null);
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let refreshRequestId = 0;

async function refresh(): Promise<void> {
  const requestId = ++refreshRequestId;
  loading.value = true;
  try {
    const result = await listResourceAssets({
      page: page.value,
      pageSize: pageSize.value,
      assetName: keyword.value.trim() || undefined,
      tags: selectedTags.value,
      selectableOnly: true
    });
    if (requestId !== refreshRequestId) return;
    rows.value = result.list;
    total.value = result.total;
  } catch (error) {
    if (requestId !== refreshRequestId) return;
    rows.value = [];
    total.value = 0;
    ElMessage.error(apiErrorMessage(error, "图片素材加载失败"));
  } finally {
    if (requestId === refreshRequestId) loading.value = false;
  }
}

async function refreshTags(): Promise<void> {
  try {
    tags.value = await listResourceAssetTags();
  } catch (error) {
    tags.value = [];
    ElMessage.warning(apiErrorMessage(error, "素材标签加载失败"));
  }
}

function search(): void {
  page.value = 1;
  void refresh();
}

function choose(asset: ResourceAsset): void {
  pendingSelection.value = asset;
}

function confirm(): void {
  if (!pendingSelection.value) return;
  emit("select", pendingSelection.value);
  visible.value = false;
}

async function afterUploaded(): Promise<void> {
  page.value = 1;
  await Promise.all([refresh(), refreshTags()]);
  if (rows.value.length) pendingSelection.value = rows.value[0];
}

watch(keyword, () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(search, 300);
});

watch(selectedTags, search, { deep: true });

watch(visible, opened => {
  if (!opened) {
    refreshRequestId += 1;
    loading.value = false;
    return;
  }
  pendingSelection.value = props.selectedAsset;
  page.value = 1;
  void Promise.all([refresh(), refreshTags()]);
});

onBeforeUnmount(() => clearTimeout(debounceTimer));
</script>

<template>
  <el-dialog
    v-model="visible"
    title="从素材库选择"
    width="min(960px, calc(100vw - 32px))"
    :close-on-click-modal="false"
  >
    <div class="picker-toolbar">
      <el-input v-model="keyword" clearable placeholder="搜索素材名称" />
      <el-select
        v-model="selectedTags"
        multiple
        clearable
        collapse-tags
        placeholder="按标签筛选"
      >
        <el-option v-for="tag in tags" :key="tag" :label="tag" :value="tag" />
      </el-select>
      <el-button type="primary" @click="uploadVisible = true"
        >批量上传</el-button
      >
    </div>
    <div class="format-tip">JPG/JPEG · 单张 ≤ 500KB</div>
    <div v-loading="loading" class="picker-grid">
      <button
        v-for="asset in rows"
        :key="asset.id"
        type="button"
        class="picker-card"
        :class="{ 'is-selected': pendingSelection?.id === asset.id }"
        @click="choose(asset)"
      >
        <div class="picker-image">
          <ResourceAssetThumbnail :asset-id="asset.id" :alt="asset.assetName" />
          <span
            v-if="pendingSelection?.id === asset.id"
            class="selected-mark"
            aria-label="已选择"
          >
            ✓
          </span>
          <div class="picker-overlay">
            <strong>{{ asset.assetName }}</strong>
            <span>
              {{
                asset.width && asset.height
                  ? `${asset.width} × ${asset.height}`
                  : "尺寸未知"
              }}
              · {{ formatAssetBytes(asset.sizeBytes) }}
            </span>
            <span>{{ asset.tags.join("、") || "无标签" }}</span>
          </div>
        </div>
        <strong>{{ asset.assetName }}</strong>
        <span>#{{ asset.id }} · {{ formatAssetBytes(asset.sizeBytes) }}</span>
        <div class="picker-tags">
          <el-tag v-for="tag in asset.tags.slice(0, 3)" :key="tag" size="small">
            {{ tag }}
          </el-tag>
        </div>
      </button>
      <el-empty
        v-if="!loading && !rows.length"
        description="暂无符合条件的图片素材"
      >
        <el-button type="primary" @click="uploadVisible = true">
          批量上传
        </el-button>
      </el-empty>
    </div>
    <div class="picker-footer">
      <span>共 {{ total }} 张 · 已选 {{ pendingSelection ? 1 : 0 }} 项</span>
      <WheelPagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[12, 24, 48, 96]"
        :total="total"
        @change="refresh"
      />
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :disabled="!pendingSelection" @click="confirm">
        使用该素材
      </el-button>
    </div>
    <ResourceAssetUploadDialog
      v-model="uploadVisible"
      :tag-options="tags"
      @uploaded="afterUploaded"
    />
  </el-dialog>
</template>

<style scoped>
.picker-toolbar {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(180px, 1fr) auto;
  gap: 10px;
}

.format-tip {
  margin: 10px 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
  gap: 12px;
  min-height: 260px;
}

.picker-card {
  min-width: 0;
  padding: 0 0 10px;
  overflow: hidden;
  text-align: left;
  cursor: pointer;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
}

.picker-card:hover,
.picker-card.is-selected {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 1px var(--el-color-primary-light-5);
}

.picker-image {
  position: relative;
  aspect-ratio: 1;
  margin-bottom: 8px;
}

.selected-mark {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  color: white;
  background: var(--el-color-primary);
  border-radius: 50%;
}

.picker-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 12px;
  color: white;
  background: linear-gradient(transparent 25%, rgb(0 0 0 / 78%));
  opacity: 0;
  transition: opacity 0.18s ease;
}

.picker-card:hover .picker-overlay,
.picker-card:focus-visible .picker-overlay {
  opacity: 1;
}

.picker-overlay span {
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  white-space: nowrap;
}

.picker-card strong,
.picker-card > span,
.picker-tags {
  display: block;
  padding: 0 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.picker-card > span {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.picker-tags {
  display: flex;
  gap: 4px;
  margin-top: 7px;
}

.picker-footer {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
  margin-top: 16px;
}

.picker-footer > span {
  margin-right: auto;
  color: var(--el-text-color-secondary);
}

@media (width <= 680px) {
  .picker-toolbar {
    grid-template-columns: 1fr;
  }

  .picker-footer {
    flex-wrap: wrap;
  }
}
</style>
