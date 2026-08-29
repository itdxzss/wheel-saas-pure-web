<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage, type UploadFile } from "element-plus";
import {
  listHyperlinkResourceAssets,
  uploadHyperlinkResourceAsset,
  type HyperlinkResourceAsset
} from "@/api/hyperlink-task";
import { apiErrorMessage } from "@/utils/api-error";
import HyperlinkProtectedAssetImage from "./HyperlinkProtectedAssetImage.vue";

const assetId = defineModel<number | null>({ required: true });
const props = defineProps<{
  label: string;
  disabled: boolean;
  unavailable?: boolean;
}>();

const dialogVisible = ref(false);
const loading = ref(false);
const uploadingCount = ref(0);
const keyword = ref("");
const loadError = ref("");
const rows = ref<HyperlinkResourceAsset[]>([]);
const page = ref(1);
const totalPages = ref(1);
const selectedId = ref<number | null>(null);
const previewUnavailable = ref(false);
let searchVersion = 0;
const selected = computed(() =>
  rows.value.find(row => row.id === selectedId.value)
);
const canLoadMore = computed(() => page.value < totalPages.value);
const uploading = computed(() => uploadingCount.value > 0);

async function loadPage(nextPage: number, append: boolean): Promise<void> {
  const version = ++searchVersion;
  loading.value = true;
  loadError.value = "";
  try {
    const result = await listHyperlinkResourceAssets({
      page: nextPage,
      pageSize: 20,
      keyword: keyword.value
    });
    if (version !== searchVersion) return;
    rows.value = append
      ? [
          ...rows.value,
          ...result.list.filter(
            item => !rows.value.some(existing => existing.id === item.id)
          )
        ]
      : result.list;
    page.value = result.page;
    totalPages.value = result.totalPages;
  } catch (error) {
    if (version !== searchVersion) return;
    loadError.value = apiErrorMessage(error, "素材加载失败");
    ElMessage.error(loadError.value);
  } finally {
    if (version === searchVersion) loading.value = false;
  }
}

const search = () => loadPage(1, false);
const loadMore = () => loadPage(page.value + 1, true);

async function open(): Promise<void> {
  selectedId.value = assetId.value;
  dialogVisible.value = true;
  await search();
}

async function upload(file: UploadFile): Promise<void> {
  if (!file.raw) return;
  if (file.raw.type !== "image/jpeg" || !/\.jpe?g$/i.test(file.raw.name)) {
    ElMessage.warning("仅支持 JPG/JPEG 图片");
    return;
  }
  if (file.raw.size > 500 * 1024) {
    ElMessage.warning("图片不能超过 500KB");
    return;
  }
  uploadingCount.value += 1;
  try {
    const uploaded = await uploadHyperlinkResourceAsset(file.raw);
    await search();
    selectedId.value = uploaded.id;
    ElMessage.success(`${file.raw.name} 已上传`);
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "素材上传失败"));
  } finally {
    uploadingCount.value = Math.max(0, uploadingCount.value - 1);
  }
}

function useAsset(): void {
  if (!selected.value?.available) {
    ElMessage.warning("该素材已不可用，请重新选择");
    return;
  }
  assetId.value = selected.value.id;
  previewUnavailable.value = false;
  dialogVisible.value = false;
}

watch(assetId, () => {
  previewUnavailable.value = false;
});
</script>

<template>
  <div class="asset-picker">
    <div v-if="assetId" class="asset-preview">
      <HyperlinkProtectedAssetImage
        :asset-id="assetId"
        class="asset-image"
        @error="previewUnavailable = true"
      />
      <div class="asset-actions">
        <el-tag v-if="unavailable || previewUnavailable" type="danger">
          素材已不可用
        </el-tag>
        <span v-else>素材 #{{ assetId }}</span>
        <template v-if="!disabled">
          <el-button link type="primary" @click="open">更换</el-button>
          <el-button link type="danger" @click="assetId = null">清空</el-button>
        </template>
      </div>
    </div>
    <el-button v-else-if="!disabled" plain class="empty-asset" @click="open">
      从素材库选择{{ label }}
    </el-button>
    <el-empty v-else description="未选择素材" :image-size="70" />

    <el-dialog
      v-model="dialogVisible"
      title="从素材库选择"
      width="760px"
      destroy-on-close
    >
      <div class="asset-toolbar">
        <el-input
          v-model="keyword"
          clearable
          placeholder="按素材名称或标签搜索"
          @keyup.enter="search"
        />
        <el-button :loading="loading" @click="search">搜索</el-button>
        <el-upload
          multiple
          accept=".jpg,.jpeg,image/jpeg"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="upload"
        >
          <el-button type="primary" plain :loading="uploading">
            批量上传
          </el-button>
        </el-upload>
      </div>
      <el-alert
        v-if="loadError"
        type="error"
        :closable="false"
        :title="loadError"
        class="asset-load-error"
      >
        <el-button link type="primary" @click="search">重试</el-button>
      </el-alert>
      <el-table
        v-loading="loading"
        :data="rows"
        height="360"
        highlight-current-row
        @current-change="row => (selectedId = row?.id ?? null)"
      >
        <el-table-column width="64">
          <template #default="{ row }">
            <el-radio v-model="selectedId" :value="row.id" />
          </template>
        </el-table-column>
        <el-table-column label="预览" width="100">
          <template #default="{ row }">
            <HyperlinkProtectedAssetImage
              :asset-id="row.id"
              class="table-image"
            />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="素材名称" min-width="180" />
        <el-table-column label="标签" min-width="180">
          <template #default="{ row }">{{
            row.tags.join("、") || "-"
          }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.available ? 'success' : 'danger'">
              {{ row.available ? "可用" : "已失效" }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div class="asset-page-actions">
        <span>已加载 {{ rows.length }} 个素材</span>
        <el-button
          v-if="canLoadMore"
          link
          type="primary"
          :loading="loading"
          @click="loadMore"
        >
          加载更多
        </el-button>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!selectedId" @click="useAsset">
          使用该素材
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.asset-preview {
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}

.asset-image {
  width: 100%;
  height: 170px;
}

.asset-actions,
.asset-toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
}

.asset-actions {
  padding: 8px 12px;
}

.asset-actions span {
  margin-right: auto;
  color: var(--el-text-color-secondary);
}

.empty-asset {
  width: 100%;
  height: 100px;
  border-style: dashed;
}

.asset-toolbar {
  margin-bottom: 12px;
}

.asset-load-error {
  margin-bottom: 12px;
}

.asset-page-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-height: 34px;
  color: var(--el-text-color-secondary);
}

.asset-toolbar .el-input {
  flex: 1;
}

.table-image {
  width: 72px;
  height: 52px;
}
</style>
