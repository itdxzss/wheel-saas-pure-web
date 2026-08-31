<script setup lang="ts">
import WheelPagination from "@/components/WheelPagination/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Gallery from "~icons/solar/gallery-wide-bold-duotone";
import ResourceAssetCard from "./components/ResourceAssetCard.vue";
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
      <div class="intro-content">
        <div class="intro-icon" aria-hidden="true">
          <component :is="useRenderIcon(Gallery)" />
        </div>
        <div class="intro-copy">
          <div class="intro-title">
            WhatsApp 素材库
            <el-tag class="intro-badge" effect="plain" round>Library</el-tag>
          </div>
          <p>
            统一管理上传的图片素材；支持 JPG，单张不超过
            500KB。超链模板新建和编辑时可直接引用，避免重复上传。
          </p>
        </div>
      </div>
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

    <el-card
      shadow="never"
      class="asset-list-card"
      body-class="asset-list-card__body"
    >
      <div v-loading="loading" class="asset-grid">
        <ResourceAssetCard
          v-for="asset in rows"
          :key="asset.id"
          :asset="asset"
          @edit="openEdit"
          @remove="remove"
        />
        <el-empty v-if="!loading && !rows.length" description="暂无图片素材" />
      </div>

      <WheelPagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[12, 24, 48, 96]"
        :total="total"
        @change="refresh"
      />
    </el-card>

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

.intro-card {
  color: #fff;
  background: linear-gradient(
    110deg,
    var(--el-color-primary) 0%,
    var(--el-color-primary-dark-2) 100%
  );
  border: 0;
  box-shadow: 0 8px 22px rgb(64 158 255 / 16%);
}

.intro-card :deep(.el-card__body) {
  padding: 18px 22px;
}

.intro-content,
.intro-title {
  display: flex;
  align-items: center;
}

.intro-content {
  gap: 16px;
}

.intro-icon {
  display: flex;
  flex: 0 0 54px;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  color: #fff;
  background: rgb(255 255 255 / 14%);
  border: 1px solid rgb(255 255 255 / 36%);
  border-radius: 12px;
}

.intro-icon :deep(svg) {
  width: 30px;
  height: 30px;
}

.intro-copy {
  min-width: 0;
}

.intro-title {
  flex-wrap: wrap;
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
}

.intro-badge {
  font-weight: 600;
  color: var(--el-color-primary-dark-2);
  background: rgb(255 255 255 / 92%);
  border-color: rgb(255 255 255 / 48%);
}

.intro-copy p {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: rgb(255 255 255 / 92%);
}

.tag-filter {
  width: 260px;
}

.asset-list-card :deep(.asset-list-card__body) {
  padding: 12px;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 12px;
  min-height: 300px;
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
