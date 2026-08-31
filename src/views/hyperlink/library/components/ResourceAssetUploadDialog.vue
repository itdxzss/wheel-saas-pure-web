<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage, type UploadFile, type UploadUserFile } from "element-plus";
import { uploadResourceAsset } from "@/api/resource-asset";
import { apiErrorMessage } from "@/utils/api-error";
import {
  normalizeResourceAssetTags,
  RESOURCE_ASSET_MAX_FILES,
  type ResourceAssetUploadItem,
  uploadResourceAssetBatch,
  validateResourceAssetFile
} from "../domain/resource-asset";

const visible = defineModel<boolean>({ required: true });
const props = defineProps<{ tagOptions: string[] }>();
const emit = defineEmits<{ (event: "uploaded"): void }>();

const fileList = ref<UploadUserFile[]>([]);
const items = ref<ResourceAssetUploadItem[]>([]);
const tags = ref<string[]>([]);
const uploading = ref(false);
const progress = computed(() => {
  if (!items.value.length) return 0;
  return Math.round(
    items.value.reduce((sum, item) => sum + item.progress, 0) /
      items.value.length
  );
});
const actionText = computed(() =>
  items.value.some(item => item.status === "failed") ? "重试" : "上传"
);

function onFileChange(_file: UploadFile, files: UploadUserFile[]): void {
  const rawFiles = files.flatMap(item => (item.raw ? [item.raw] : []));
  if (rawFiles.length > RESOURCE_ASSET_MAX_FILES) {
    ElMessage.warning("一次最多选择 100 张图片");
  }
  fileList.value = files.slice(0, RESOURCE_ASSET_MAX_FILES);
  const kept = fileList.value.flatMap(item => (item.raw ? [item.raw] : []));
  items.value = kept.map(file => ({
    file,
    status: "pending",
    progress: 0,
    message: ""
  }));
}

function normalizeTags(): void {
  try {
    tags.value = normalizeResourceAssetTags(tags.value);
  } catch (error) {
    tags.value = tags.value.slice(0, 20);
    ElMessage.warning(error instanceof Error ? error.message : "标签不合法");
  }
}

async function upload(): Promise<void> {
  const pending = items.value.filter(item => item.status !== "uploading");
  if (!pending.length) {
    ElMessage.warning("请先选择图片");
    return;
  }
  for (const item of pending) {
    const validation = await validateResourceAssetFile(item.file);
    if (!validation.valid) {
      ElMessage.warning(validation.message);
      return;
    }
  }
  uploading.value = true;
  const result = await uploadResourceAssetBatch(
    pending,
    tags.value,
    uploadResourceAsset,
    error => apiErrorMessage(error, "上传失败，可重试")
  );
  const succeeded = new Set(result.succeeded);
  fileList.value = fileList.value.filter(item =>
    result.failed.some(failed => failed.file === item.raw)
  );
  items.value = items.value.filter(item => !succeeded.has(item));
  uploading.value = false;
  const success = result.succeeded.length;
  if (success > 0) emit("uploaded");
  if (!items.value.length) {
    ElMessage.success(`已上传 ${success} 张图片`);
    visible.value = false;
  } else {
    ElMessage.warning(`${success} 张成功，${items.value.length} 张失败`);
  }
}

function reset(): void {
  fileList.value = [];
  items.value = [];
  tags.value = [];
  uploading.value = false;
}

function beforeClose(done: () => void): void {
  if (!uploading.value) done();
}

watch(visible, opened => {
  if (!opened) reset();
});
</script>

<template>
  <el-dialog
    v-model="visible"
    title="批量上传图片"
    width="min(640px, calc(100vw - 32px))"
    :close-on-click-modal="false"
    :close-on-press-escape="!uploading"
    :show-close="!uploading"
    :before-close="beforeClose"
  >
    <el-alert
      title="一次最多 100 张，公共标签将应用于本次所有图片。"
      type="info"
      :closable="false"
      show-icon
    />
    <el-upload
      v-model:file-list="fileList"
      drag
      multiple
      accept=".jpg,.jpeg,image/jpeg"
      :auto-upload="false"
      :disabled="uploading"
      :on-change="onFileChange"
      :on-remove="onFileChange"
      class="asset-upload"
    >
      <div>点击或拖拽图片到此处</div>
      <template #tip>
        <div class="el-upload__tip">
          JPG/JPEG，最多 100 张，单张不超过 500KB
        </div>
      </template>
    </el-upload>
    <el-form-item label="公共标签">
      <el-select
        v-model="tags"
        multiple
        filterable
        allow-create
        default-first-option
        clearable
        placeholder="选择或输入标签"
        class="full-width"
        @change="normalizeTags"
      >
        <el-option
          v-for="tag in props.tagOptions"
          :key="tag"
          :label="tag"
          :value="tag"
        />
      </el-select>
    </el-form-item>
    <el-progress v-if="uploading" :percentage="progress" />
    <div v-if="items.length" class="upload-status-list">
      <div
        v-for="item in items"
        :key="item.file.name + item.file.size + item.file.lastModified"
        class="upload-status-item"
      >
        <div class="upload-status-meta">
          <span>{{ item.file.name }}</span>
          <span v-if="item.message" class="failed-message">{{
            item.message
          }}</span>
          <span v-else-if="item.status === 'uploading'">上传中</span>
          <span v-else>待上传</span>
        </div>
        <el-progress
          :percentage="item.progress"
          :status="item.status === 'failed' ? 'exception' : undefined"
        />
      </div>
    </div>
    <template #footer>
      <span class="selected-count">已选择 {{ items.length }}/100</span>
      <el-button :disabled="uploading" @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="uploading" @click="upload">
        {{ actionText }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.asset-upload {
  margin: 16px 0;
}

.full-width,
:deep(.el-upload),
:deep(.el-upload-dragger) {
  width: 100%;
}

.upload-status-list {
  max-height: 120px;
  margin-top: 12px;
  overflow: auto;
  font-size: 12px;
}

.upload-status-item,
:deep(.el-dialog__footer) {
  display: flex;
  gap: 12px;
  align-items: center;
}

.upload-status-item :deep(.el-progress) {
  flex: 1;
}

.upload-status-meta {
  display: grid;
  width: 240px;
  min-width: 0;
}

.upload-status-meta span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.failed-message {
  color: var(--el-color-danger);
}

.selected-count {
  margin-right: auto;
  color: var(--el-text-color-secondary);
}
</style>
