import { computed, onBeforeUnmount, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  copyHyperlinkTemplate,
  createHyperlinkTemplate,
  deleteHyperlinkTemplate,
  getHyperlinkTemplate,
  listHyperlinkTemplates,
  updateHyperlinkTemplate,
  type HyperlinkTemplateListItem,
  type SupportedHyperlinkMessageType
} from "@/api/hyperlink-template";
import { downloadResourceAsset, getResourceAsset } from "@/api/resource-asset";
import { apiErrorMessage } from "@/utils/api-error";
import { createImageObjectUrlController } from "../domain/image-object-url";
import {
  createEmptyHyperlinkTemplateForm,
  toHyperlinkTemplateForm,
  toHyperlinkTemplateUpdateRequest,
  toHyperlinkTemplateWriteRequest,
  validateHyperlinkTemplateForm,
  type HyperlinkTemplateForm
} from "../domain/template-form";

export type HyperlinkTemplateDrawerMode = "create" | "edit";

export interface HyperlinkTemplateSearchForm {
  name: string;
  messageType: "" | SupportedHyperlinkMessageType;
}

const PAGE_SIZE = 20;

function isCancel(error: unknown): boolean {
  return error === "cancel" || error === "close";
}

export function useHyperlinkTemplatePage() {
  const searchForm = ref<HyperlinkTemplateSearchForm>({
    name: "",
    messageType: ""
  });
  const rows = ref<HyperlinkTemplateListItem[]>([]);
  const loading = ref(false);
  const errorMessage = ref("");
  const page = ref(1);
  const pageSize = ref(PAGE_SIZE);
  const total = ref(0);

  const drawerVisible = ref(false);
  const drawerMode = ref<HyperlinkTemplateDrawerMode>("create");
  const form = ref<HyperlinkTemplateForm>(createEmptyHyperlinkTemplateForm());
  const editingId = ref<number | null>(null);
  const detailLoading = ref(false);
  const imageLoading = ref(false);
  const saving = ref(false);

  const objectUrlController = createImageObjectUrlController();
  let detailRequestId = 0;
  let imageRequestId = 0;

  const columns: TableColumnList = [
    { label: "模板名称 / 类型", prop: "name", minWidth: 260 },
    { label: "更新时间", prop: "updatedAt", width: 180 }
  ];

  const drawerTitle = computed(() => {
    if (drawerMode.value === "edit") return "编辑超链模板";
    return "新建超链模板";
  });

  function releaseImagePreview(): void {
    imageRequestId += 1;
    objectUrlController.clear();
    form.value.imageUrl = "";
    imageLoading.value = false;
  }

  function clearImage(): void {
    releaseImagePreview();
    form.value.assetId = null;
    form.value.imageName = "";
  }

  async function loadImage(assetId: number | null): Promise<void> {
    if (assetId == null) return;
    const requestId = ++imageRequestId;
    imageLoading.value = true;
    try {
      const [blob, asset] = await Promise.all([
        downloadResourceAsset(assetId),
        getResourceAsset(assetId)
      ]);
      if (requestId !== imageRequestId) return;
      form.value.imageName = asset.assetName;
      form.value.imageUrl = objectUrlController.replace(blob);
    } catch (error) {
      if (requestId !== imageRequestId) return;
      form.value.imageUrl = "";
      ElMessage.error(apiErrorMessage(error, "模板图片加载失败"));
    } finally {
      if (requestId === imageRequestId) imageLoading.value = false;
    }
  }

  async function refresh(): Promise<void> {
    loading.value = true;
    errorMessage.value = "";
    try {
      const result = await listHyperlinkTemplates({
        page: page.value,
        pageSize: pageSize.value,
        name: searchForm.value.name.trim() || undefined,
        messageType: searchForm.value.messageType || undefined
      });
      rows.value = result.list;
      page.value = result.page;
      pageSize.value = result.pageSize;
      total.value = result.total;
    } catch (error) {
      rows.value = [];
      total.value = 0;
      errorMessage.value = apiErrorMessage(error, "超链营销模板加载失败");
    } finally {
      loading.value = false;
    }
  }

  async function search(): Promise<void> {
    page.value = 1;
    await refresh();
  }

  async function resetSearch(): Promise<void> {
    searchForm.value = { name: "", messageType: "" };
    await search();
  }

  function openCreate(): void {
    releaseImagePreview();
    form.value = createEmptyHyperlinkTemplateForm();
    editingId.value = null;
    drawerMode.value = "create";
    drawerVisible.value = true;
  }

  async function openDetail(row: HyperlinkTemplateListItem): Promise<void> {
    if (row.messageType === 2) {
      ElMessage.warning("一期暂不支持双图文");
      return;
    }
    releaseImagePreview();
    form.value = createEmptyHyperlinkTemplateForm();
    editingId.value = row.id;
    drawerMode.value = "edit";
    drawerVisible.value = true;
    detailLoading.value = true;
    const requestId = ++detailRequestId;
    try {
      const detail = await getHyperlinkTemplate(row.id);
      if (requestId !== detailRequestId) return;
      if (detail.messageType === 2) throw new Error("一期暂不支持双图文");
      form.value = toHyperlinkTemplateForm(detail);
    } catch (error) {
      if (requestId !== detailRequestId) return;
      drawerVisible.value = false;
      ElMessage.error(apiErrorMessage(error, "模板详情加载失败"));
    } finally {
      if (requestId === detailRequestId) detailLoading.value = false;
    }
  }

  function changeMessageType(): void {
    clearImage();
    if (form.value.messageType === 3 || form.value.messageType === 4) {
      if (!form.value.button.displayText.trim()) {
        form.value.button.displayText = "立即查看";
      }
      if (!form.value.button.targetValue.trim()) {
        form.value.button.targetValue = "https://example.com/promo";
      }
    }
    if (form.value.messageType === 4 && !form.value.cardText.trim()) {
      form.value.cardText = "点击下方按钮查看详情";
    }
  }

  async function save(): Promise<void> {
    const validationMessage = validateHyperlinkTemplateForm(form.value);
    if (validationMessage) {
      ElMessage.warning(validationMessage);
      return;
    }
    saving.value = true;
    try {
      if (drawerMode.value === "edit") {
        if (editingId.value == null)
          throw new Error("模板 ID 无效，请刷新后重试");
        await updateHyperlinkTemplate(
          editingId.value,
          toHyperlinkTemplateUpdateRequest(form.value)
        );
        ElMessage.success("超链营销模板已更新");
      } else {
        await createHyperlinkTemplate(
          toHyperlinkTemplateWriteRequest(form.value)
        );
        ElMessage.success("超链营销模板已创建");
      }
      drawerVisible.value = false;
      await refresh();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "超链营销模板保存失败"));
    } finally {
      saving.value = false;
    }
  }

  async function copy(row: HyperlinkTemplateListItem): Promise<void> {
    try {
      await copyHyperlinkTemplate(row.id);
      ElMessage.success("超链营销模板已复制");
      await refresh();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "超链营销模板复制失败"));
    }
  }

  async function remove(row: HyperlinkTemplateListItem): Promise<void> {
    try {
      await ElMessageBox.confirm(`确认删除模板“${row.name}”吗？`, "删除确认", {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消"
      });
      await deleteHyperlinkTemplate(row.id);
      ElMessage.success("超链营销模板已删除");
      if (rows.value.length === 1 && page.value > 1) page.value -= 1;
      await refresh();
    } catch (error) {
      if (isCancel(error)) return;
      ElMessage.error(apiErrorMessage(error, "超链营销模板删除失败"));
    }
  }

  watch(drawerVisible, visible => {
    if (visible) return;
    detailRequestId += 1;
    detailLoading.value = false;
    releaseImagePreview();
  });

  watch(
    () => form.value.assetId,
    assetId => {
      releaseImagePreview();
      if (assetId != null) void loadImage(assetId);
    }
  );

  onBeforeUnmount(() => {
    detailRequestId += 1;
    releaseImagePreview();
  });

  return {
    columns,
    detailLoading,
    drawerMode,
    drawerTitle,
    drawerVisible,
    errorMessage,
    form,
    imageLoading,
    loading,
    page,
    pageSize,
    rows,
    saving,
    searchForm,
    total,
    changeMessageType,
    copy,
    openCreate,
    openDetail,
    refresh,
    remove,
    resetSearch,
    save,
    search
  };
}
