<script setup lang="ts">
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import type { ResourceAsset } from "@/api/resource-asset";
import Edit from "~icons/ep/edit";
import Delete from "~icons/ep/delete";
import { formatAssetBytes } from "../domain/resource-asset";
import ResourceAssetThumbnail from "./ResourceAssetThumbnail.vue";

defineProps<{ asset: ResourceAsset }>();

defineEmits<{
  (event: "edit", asset: ResourceAsset): void;
  (event: "remove", asset: ResourceAsset): void;
}>();
</script>

<template>
  <el-card shadow="hover" class="asset-card" body-class="asset-card__body">
    <div class="asset-image">
      <ResourceAssetThumbnail
        :asset-id="asset.id"
        :alt="asset.assetName"
        fit="contain"
      />
    </div>
    <div class="asset-heading">
      <div class="asset-name" :title="asset.assetName">
        {{ asset.assetName }}
      </div>
      <div class="asset-id">#{{ asset.id }}</div>
    </div>
    <div class="asset-tags">
      <template v-if="asset.tags.length">
        <el-tag v-for="tag in asset.tags.slice(0, 3)" :key="tag" size="small">
          {{ tag }}
        </el-tag>
        <el-tag v-if="asset.tags.length > 3" size="small" type="info">
          +{{ asset.tags.length - 3 }}
        </el-tag>
      </template>
      <span v-else>无标签</span>
    </div>
    <div class="asset-meta">
      <div class="asset-meta-row">
        <span>尺寸</span>
        <strong>{{
          asset.width && asset.height
            ? `${asset.width} × ${asset.height}`
            : "未知"
        }}</strong>
      </div>
      <div class="asset-meta-row">
        <span>大小</span>
        <strong>{{ formatAssetBytes(asset.sizeBytes) }}</strong>
      </div>
      <div class="asset-meta-row">
        <span>引用</span>
        <strong :class="{ 'is-referenced': asset.referenceCount > 0 }">
          {{ asset.referenceCount }}
        </strong>
      </div>
    </div>
    <div class="asset-actions">
      <el-button
        v-auth="'tenant:resource_asset:edit'"
        link
        type="primary"
        :icon="useRenderIcon(Edit)"
        @click="$emit('edit', asset)"
      >
        编辑
      </el-button>
      <el-tooltip
        :disabled="asset.referenceCount === 0"
        :content="`仍被 ${asset.referenceCount} 处模板或任务引用，不能删除`"
      >
        <span>
          <el-popconfirm
            title="确认删除该素材？"
            confirm-button-text="删除"
            cancel-button-text="取消"
            :disabled="asset.referenceCount > 0"
            @confirm="$emit('remove', asset)"
          >
            <template #reference>
              <el-button
                v-auth="'tenant:resource_asset:delete'"
                link
                type="danger"
                :icon="useRenderIcon(Delete)"
                :disabled="asset.referenceCount > 0"
              >
                删除
              </el-button>
            </template>
          </el-popconfirm>
        </span>
      </el-tooltip>
    </div>
  </el-card>
</template>

<style scoped>
.asset-card {
  height: 100%;
}

.asset-card :deep(.asset-card__body) {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 0 8px;
}

.asset-image {
  min-height: 0;
  aspect-ratio: 16 / 9;
  margin-bottom: 8px;
  overflow: hidden;
}

.asset-heading,
.asset-tags,
.asset-meta,
.asset-actions {
  margin-right: 10px;
  margin-left: 10px;
}

.asset-heading {
  display: flex;
  gap: 8px;
  align-items: baseline;
}

.asset-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
  white-space: nowrap;
}

.asset-id {
  flex: 0 0 auto;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.asset-tags {
  display: flex;
  gap: 4px;
  min-height: 22px;
  margin-top: 6px;
  overflow: hidden;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.asset-meta {
  display: grid;
  gap: 3px;
  padding: 7px 9px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
}

.asset-meta-row {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}

.asset-meta-row strong {
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.asset-meta-row strong.is-referenced {
  color: var(--el-color-warning-dark-2);
}

.asset-actions {
  display: flex;
  justify-content: space-between;
  padding-top: 5px;
  margin-top: auto;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
