<script setup lang="ts">
import WheelPagination from "@/components/WheelPagination/index.vue";
import { formatAssetBytes } from "./domain/resource-asset";
import ResourceAssetThumbnail from "./components/ResourceAssetThumbnail.vue";
import ResourceAssetUploadDialog from "./components/ResourceAssetUploadDialog.vue";
import { useResourceAssetLibrary } from "./composables/useResourceAssetLibrary";

defineOptions({ name: "HyperlinkResourceAssetLibrary" });

const {
  rows,
  tagOptions,
  keyword,
  selectedTags,
  page,
  pageSize,
  total,
  loading,
  errorMessage,
  uploadVisible,
  editVisible,
  editName,
  editTags,
  saving,
  refresh,
  reset,
  openEdit,
  normalizeEditTags,
  saveEdit,
  remove,
  afterUploaded
} = useResourceAssetLibrary();
</script>

<template>
  <div class="asset-library-page">
    <el-card shadow="never" class="intro-card">
      <div class="intro-title">
        WhatsApp 素材库
        <el-tag type="success" effect="plain" round>Library</el-tag>
      </div>
      <p>
        统一管理上传的图片素材；支持 JPG，单张不超过
        500KB。超链模板新建和编辑时可直接引用，避免重复上传。
      </p>
    </el-card>

    <el-card shadow="never" class="filter-card">
      <el-form inline>
        <el-form-item label="素材名称">
          <el-input v-model="keyword" clearable placeholder="按名称搜索" />
        </el-form-item>
        <el-form-item label="素材标签">
          <el-select
            v-model="selectedTags"
            multiple
            clearable
            collapse-tags
            placeholder="按标签筛选（任意匹配）"
            class="tag-filter"
          >
            <el-option
              v-for="tag in tagOptions"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>
        <el-form-item><el-button @click="reset">重置</el-button></el-form-item>
        <el-form-item>
          <el-button
            v-auth="'tenant:resource_asset:upload'"
            type="primary"
            @click="uploadVisible = true"
          >
            批量上传
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-alert
      v-if="errorMessage"
      :title="errorMessage"
      type="error"
      show-icon
      :closable="false"
      class="error-alert"
    />

    <div v-loading="loading" class="asset-grid">
      <el-card
        v-for="asset in rows"
        :key="asset.id"
        shadow="hover"
        class="asset-card"
      >
        <div class="asset-image">
          <ResourceAssetThumbnail :asset-id="asset.id" :alt="asset.assetName" />
        </div>
        <div class="asset-name" :title="asset.assetName">
          {{ asset.assetName }}
        </div>
        <div class="asset-id">#{{ asset.id }}</div>
        <div class="asset-tags">
          <template v-if="asset.tags.length">
            <el-tag
              v-for="tag in asset.tags.slice(0, 3)"
              :key="tag"
              size="small"
            >
              {{ tag }}
            </el-tag>
            <el-tag v-if="asset.tags.length > 3" size="small" type="info">
              +{{ asset.tags.length - 3 }}
            </el-tag>
          </template>
          <span v-else>无标签</span>
        </div>
        <div class="asset-meta">
          <span>{{
            asset.width && asset.height
              ? `${asset.width} × ${asset.height}`
              : "-"
          }}</span>
          <span>{{ formatAssetBytes(asset.sizeBytes) }}</span>
          <span>引用 {{ asset.referenceCount }}</span>
        </div>
        <div class="asset-actions">
          <el-button
            v-auth="'tenant:resource_asset:edit'"
            link
            type="primary"
            @click="openEdit(asset)"
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
                @confirm="remove(asset)"
              >
                <template #reference>
                  <el-button
                    v-auth="'tenant:resource_asset:delete'"
                    link
                    type="danger"
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
      <el-empty v-if="!loading && !rows.length" description="暂无图片素材" />
    </div>

    <WheelPagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :page-sizes="[12, 24, 48, 96]"
      :total="total"
      @change="refresh"
    />

    <ResourceAssetUploadDialog
      v-model="uploadVisible"
      :tag-options="tagOptions"
      @uploaded="afterUploaded"
    />

    <el-dialog
      v-model="editVisible"
      title="编辑素材"
      width="min(460px, calc(100vw - 32px))"
    >
      <el-form label-position="top">
        <el-form-item label="素材名称" required>
          <el-input v-model="editName" maxlength="128" show-word-limit />
        </el-form-item>
        <el-form-item label="素材标签">
          <el-select
            v-model="editTags"
            multiple
            filterable
            allow-create
            default-first-option
            clearable
            class="full-width"
            @change="normalizeEditTags"
          >
            <el-option
              v-for="tag in tagOptions"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveEdit"
          >保存</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.asset-library-page {
  padding: 16px;
}

.intro-card,
.filter-card,
.error-alert {
  margin-bottom: 12px;
}

.intro-title {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 20px;
  font-weight: 650;
}

.intro-card p {
  margin: 8px 0 0;
  color: var(--el-text-color-secondary);
}

.tag-filter {
  width: 260px;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
  min-height: 300px;
  margin-bottom: 16px;
}

.asset-card :deep(.el-card__body) {
  padding: 0 0 12px;
}

.asset-image {
  aspect-ratio: 5 / 4;
  margin-bottom: 10px;
}

.asset-name,
.asset-id,
.asset-tags,
.asset-meta,
.asset-actions {
  padding: 0 12px;
}

.asset-name {
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
  white-space: nowrap;
}

.asset-id {
  margin-top: 3px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.asset-tags {
  display: flex;
  gap: 4px;
  min-height: 24px;
  margin-top: 9px;
  overflow: hidden;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.asset-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.asset-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.full-width {
  width: 100%;
}

@media (width <= 600px) {
  .asset-grid {
    grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
  }
}
</style>
