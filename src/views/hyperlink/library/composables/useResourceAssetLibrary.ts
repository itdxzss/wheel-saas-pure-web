import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  deleteResourceAsset,
  listResourceAssets,
  listResourceAssetTags,
  updateResourceAsset,
  type ResourceAsset
} from "@/api/resource-asset";
import { apiErrorMessage } from "@/utils/api-error";
import { normalizeResourceAssetTags } from "../domain/resource-asset";

/** 图片素材管理页的查询、编辑和删除状态。 */
export function useResourceAssetLibrary() {
  const rows = ref<ResourceAsset[]>([]);
  const tagOptions = ref<string[]>([]);
  const keyword = ref("");
  const selectedTags = ref<string[]>([]);
  const page = ref(1);
  const pageSize = ref<12 | 24 | 48 | 96>(24);
  const total = ref(0);
  const loading = ref(false);
  const errorMessage = ref("");
  const uploadVisible = ref(false);
  const editVisible = ref(false);
  const editing = ref<ResourceAsset | null>(null);
  const editName = ref("");
  const editTags = ref<string[]>([]);
  const saving = ref(false);
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let refreshRequestId = 0;

  async function refresh(): Promise<void> {
    const requestId = ++refreshRequestId;
    loading.value = true;
    errorMessage.value = "";
    try {
      const result = await listResourceAssets({
        page: page.value,
        pageSize: pageSize.value,
        assetName: keyword.value.trim() || undefined,
        tags: selectedTags.value
      });
      if (requestId !== refreshRequestId) return;
      rows.value = result.list;
      total.value = result.total;
    } catch (error) {
      if (requestId !== refreshRequestId) return;
      rows.value = [];
      total.value = 0;
      errorMessage.value = apiErrorMessage(error, "图片素材加载失败");
    } finally {
      if (requestId === refreshRequestId) loading.value = false;
    }
  }

  async function refreshTags(): Promise<void> {
    try {
      tagOptions.value = await listResourceAssetTags();
    } catch (error) {
      tagOptions.value = [];
      ElMessage.warning(apiErrorMessage(error, "素材标签加载失败"));
    }
  }

  function search(): void {
    page.value = 1;
    void refresh();
  }

  function reset(): void {
    keyword.value = "";
    selectedTags.value = [];
    search();
  }

  function openEdit(asset: ResourceAsset): void {
    editing.value = asset;
    editName.value = asset.assetName;
    editTags.value = [...asset.tags];
    editVisible.value = true;
  }

  function normalizeEditTags(): void {
    try {
      editTags.value = normalizeResourceAssetTags(editTags.value);
    } catch (error) {
      editTags.value = editTags.value.slice(0, 20);
      ElMessage.warning(error instanceof Error ? error.message : "标签不合法");
    }
  }

  async function saveEdit(): Promise<void> {
    if (!editing.value) return;
    const name = editName.value.trim();
    if (!name) {
      ElMessage.warning("素材名称不能为空");
      return;
    }
    saving.value = true;
    try {
      await updateResourceAsset(editing.value.id, {
        assetName: name,
        tags: normalizeResourceAssetTags(editTags.value)
      });
      ElMessage.success("素材信息已更新");
      editVisible.value = false;
      await Promise.all([refresh(), refreshTags()]);
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "素材信息更新失败"));
    } finally {
      saving.value = false;
    }
  }

  async function remove(asset: ResourceAsset): Promise<void> {
    if (asset.referenceCount > 0) return;
    try {
      await deleteResourceAsset(asset.id);
      ElMessage.success("删除成功");
      if (rows.value.length === 1 && page.value > 1) page.value -= 1;
      await Promise.all([refresh(), refreshTags()]);
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "素材删除失败"));
    }
  }

  async function afterUploaded(): Promise<void> {
    page.value = 1;
    await Promise.all([refresh(), refreshTags()]);
  }

  watch(keyword, () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(search, 300);
  });
  watch(selectedTags, search, { deep: true });
  onBeforeUnmount(() => {
    refreshRequestId += 1;
    clearTimeout(debounceTimer);
  });
  onMounted(() => void Promise.all([refresh(), refreshTags()]));

  return {
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
  };
}
