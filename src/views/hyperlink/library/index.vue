<script setup lang="ts">
import type { ResourceAssetScope } from "@/api/resource-asset";
import { hasAuth } from "@/router/utils";
import ResourceAssetGroupManager from "./components/ResourceAssetGroupManager.vue";
import WheelPagination from "@/components/WheelPagination/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Gallery from "~icons/solar/gallery-wide-bold-duotone";
import ResourceAssetCard from "./components/ResourceAssetCard.vue";
import ResourceAssetUploadDialog from "./components/ResourceAssetUploadDialog.vue";
import { useResourceAssetLibrary } from "./composables/useResourceAssetLibrary";

defineOptions({ name: "HyperlinkResourceAssetLibrary" });

const props = withDefaults(defineProps<{ scope?: ResourceAssetScope }>(), {
  scope: "HYPERLINK"
});
const permissionPrefix =
  props.scope === "SCRIPT"
    ? "tenant:script_marketing"
    : "tenant:resource_asset";
const editPermission = `${permissionPrefix}:edit`;
const deletePermission = `${permissionPrefix}:delete`;
const uploadPermission =
  props.scope === "SCRIPT"
    ? "tenant:script_marketing:create"
    : "tenant:resource_asset:upload";

const {
  groups,
  selectedGroup,
  selectedIds,
  groupManagerVisible,
  groupBusy,
  moveVisible,
  moveGroupId,
  createGroup,
  deleteGroup,
  openMove,
  moveSelected,
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
} = useResourceAssetLibrary(props.scope);
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
            <el-tag class="intro-badge" effect="plain" round>{{
              scope === "SCRIPT" ? "养群图片" : "超链图片"
            }}</el-tag>
          </div>
          <p>
            统一管理上传的图片素材；支持 JPG/JPEG/PNG，单张不超过
            500KB。历史图片两边均可使用，新上传的图片仅在当前业务中可见。
          </p>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="filter-card">
      <div class="filter-toolbar">
        <el-form inline class="filter-form">
          <el-form-item label="素材分组">
            <el-select
              v-model="selectedGroup"
              clearable
              placeholder="全部分组"
              class="group-filter"
            >
              <el-option label="未分组" :value="0" />
              <el-option
                v-for="group in groups"
                :key="group.id"
                :label="group.groupName"
                :value="group.id"
              />
            </el-select>
          </el-form-item>
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
          <el-form-item
            ><el-button @click="reset">重置</el-button></el-form-item
          >
        </el-form>
        <div class="library-actions">
          <el-button
            v-if="hasAuth(editPermission) || hasAuth(deletePermission)"
            @click="groupManagerVisible = true"
            >管理分组</el-button
          >
          <el-button
            v-if="
              hasAuth(uploadPermission) ||
              (scope === 'SCRIPT' && hasAuth(editPermission))
            "
            type="primary"
            @click="uploadVisible = true"
          >
            批量上传
          </el-button>
        </div>
      </div>
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
      <div v-auth="editPermission" class="batch-toolbar">
        <el-checkbox
          :model-value="rows.length > 0 && selectedIds.length === rows.length"
          :indeterminate="
            selectedIds.length > 0 && selectedIds.length < rows.length
          "
          :disabled="loading || !rows.length"
          @change="selectedIds = $event ? rows.map(asset => asset.id) : []"
          >选择本页</el-checkbox
        >
        <span>已选 {{ selectedIds.length }} 张</span>
        <el-button :disabled="!selectedIds.length || loading" @click="openMove"
          >移动到分组</el-button
        >
      </div>
      <div v-loading="loading" class="asset-grid">
        <div v-for="asset in rows" :key="asset.id" class="asset-item">
          <el-checkbox-group
            v-model="selectedIds"
            v-auth="editPermission"
            class="asset-selection"
          >
            <el-checkbox
              :value="asset.id"
              :aria-label="`选择素材 ${asset.assetName}`"
            />
          </el-checkbox-group>
          <ResourceAssetCard
            :asset="asset"
            :scope="scope"
            :edit-permission="editPermission"
            :delete-permission="deletePermission"
            :group-name="
              groups.find(group => group.id === asset.groupId)?.groupName ||
              '未分组'
            "
            @edit="openEdit"
            @remove="remove"
          />
        </div>
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
      :groups="groups"
      :default-group-id="selectedGroup"
      :scope="scope"
      @uploaded="afterUploaded"
    />

    <ResourceAssetGroupManager
      v-model="groupManagerVisible"
      :groups="groups"
      :busy="groupBusy"
      :edit-permission="editPermission"
      :delete-permission="deletePermission"
      @create="createGroup"
      @remove="deleteGroup"
    />
    <el-dialog
      v-model="moveVisible"
      title="移动到分组"
      width="min(460px, calc(100vw - 32px))"
    >
      <el-form label-position="top">
        <el-form-item :label="`将选中的 ${selectedIds.length} 张图片移到`">
          <el-select v-model="moveGroupId" class="full-width">
            <el-option label="未分组" :value="0" />
            <el-option
              v-for="group in groups"
              :key="group.id"
              :label="group.groupName"
              :value="group.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="groupBusy" @click="moveVisible = false"
          >取消</el-button
        >
        <el-button type="primary" :loading="groupBusy" @click="moveSelected"
          >确认移动</el-button
        >
      </template>
    </el-dialog>

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

.filter-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
  align-items: flex-start;
}

.filter-form {
  display: flex;
  flex: 1 1 720px;
  flex-wrap: wrap;
  gap: 12px 20px;
}

.filter-form :deep(.el-form-item) {
  margin: 0;
}

.filter-form :deep(.el-input) {
  width: 180px;
}

.library-actions {
  display: flex;
  flex-shrink: 0;
  gap: 12px;
  margin-left: auto;
}

.library-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.group-filter {
  width: 180px;
}

.batch-toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 12px;
}

.asset-item {
  position: relative;
  min-width: 0;
}

.asset-selection {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 1;
  padding: 0 8px;
  background: var(--el-bg-color);
  border-radius: 4px;
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
