import { computed, onBeforeUnmount, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  copyHyperlinkTemplate,
  createHyperlinkTemplate,
  deleteHyperlinkTemplate,
  downloadHyperlinkTemplateImage,
  getHyperlinkTemplate,
  listHyperlinkTemplates,
  updateHyperlinkTemplate,
  uploadHyperlinkTemplateImage,
  type HyperlinkTemplateListItem,
  type SupportedHyperlinkMessageType
} from "@/api/hyperlink-template";
import { apiErrorMessage } from "@/utils/api-error";
import { createImageObjectUrlController } from "../domain/image-object-url";
import {
  createEmptyHyperlinkTemplateForm,
  toHyperlinkTemplateForm,
  toHyperlinkTemplateUpdateRequest,
  toHyperlinkTemplateWriteRequest,
  validateHyperlinkImageFile,
  validateHyperlinkTemplateForm,
  type HyperlinkTemplateForm
} from "../domain/template-form";

export type HyperlinkTemplateDrawerMode = "create" | "edit" | "preview";

export interface HyperlinkTemplateSearchForm {
  name: string;
  messageType: "" | SupportedHyperlinkMessageType;
  createdRange: string[];
}

const PAGE_SIZE = 20;

function isCancel(error: unknown): boolean {
  return error === "cancel" || error === "close";
}

export function useHyperlinkTemplatePage() {
  const searchForm = ref<HyperlinkTemplateSearchForm>({
    name: "",
    messageType: "",
    createdRange: []
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
  let imageSelectionRequestId = 0;

  const columns: TableColumnList = [
    { label: "ID", prop: "id", width: 90 },
    { label: "模板名称", prop: "name", minWidth: 180 },
    { label: "消息类型", prop: "messageType", width: 120 },
    { label: "标题", prop: "title", minWidth: 180 },
    { label: "任务引用", prop: "taskRefCount", width: 100 },
    { label: "版本", prop: "version", width: 90 },
    { label: "更新时间", prop: "updatedAt", width: 180 }
  ];

  const drawerTitle = computed(() => {
    if (drawerMode.value === "edit") return "编辑超链营销模板";
    if (drawerMode.value === "preview") return "模板详情与预览";
    return "创建超链营销模板";
  });

  function releaseImagePreview(): void {
    imageRequestId += 1;
    imageSelectionRequestId += 1;
    objectUrlController.clear();
    form.value.imageUrl = "";
    imageLoading.value = false;
  }

  function clearImage(): void {
    releaseImagePreview();
    form.value.assetId = null;
    form.value.imageName = "";
    form.value.imageFile = null;
  }

  async function loadImage(assetId: number | null): Promise<void> {
    if (assetId == null) return;
    const requestId = ++imageRequestId;
    imageLoading.value = true;
    try {
      const blob = await downloadHyperlinkTemplateImage(assetId);
      if (requestId !== imageRequestId) return;
      form.value.imageUrl = objectUrlController.replace(blob);
    } catch (error) {
      if (requestId !== imageRequestId) return;
      form.value.imageUrl = "";
      ElMessage.error(apiErrorMessage(error, "模板图片加载失败"));
    } finally {
      if (requestId === imageRequestId) imageLoading.value = false;
    }
  }

  async function selectImage(file: File): Promise<boolean> {
    const requestId = ++imageSelectionRequestId;
    const result = await validateHyperlinkImageFile(file);
    if (requestId !== imageSelectionRequestId) return false;
    if (!result.valid) {
      ElMessage.warning(result.message);
      return false;
    }
    releaseImagePreview();
    form.value.assetId = null;
    form.value.imageName = file.name;
    form.value.imageFile = file;
    form.value.imageUrl = objectUrlController.replace(file);
    return true;
  }

  async function refresh(): Promise<void> {
    loading.value = true;
    errorMessage.value = "";
    try {
      const [createdFromValue, createdToValue] = searchForm.value.createdRange;
      const result = await listHyperlinkTemplates({
        page: page.value,
        pageSize: PAGE_SIZE,
        name: searchForm.value.name.trim() || undefined,
        messageType: searchForm.value.messageType || undefined,
        createdFrom: createdFromValue ? Number(createdFromValue) : undefined,
        createdTo: createdToValue ? Number(createdToValue) : undefined
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
    searchForm.value = { name: "", messageType: "", createdRange: [] };
    await search();
  }

  function openCreate(): void {
    releaseImagePreview();
    form.value = createEmptyHyperlinkTemplateForm();
    editingId.value = null;
    drawerMode.value = "create";
    drawerVisible.value = true;
  }

  async function openDetail(
    row: HyperlinkTemplateListItem,
    mode: Exclude<HyperlinkTemplateDrawerMode, "create">
  ): Promise<void> {
    if (row.messageType === 2) {
      ElMessage.warning("一期暂不支持双图文");
      return;
    }
    releaseImagePreview();
    form.value = createEmptyHyperlinkTemplateForm();
    editingId.value = row.id;
    drawerMode.value = mode;
    drawerVisible.value = true;
    detailLoading.value = true;
    const requestId = ++detailRequestId;
    try {
      const detail = await getHyperlinkTemplate(row.id);
      if (requestId !== detailRequestId) return;
      if (detail.messageType === 2) throw new Error("一期暂不支持双图文");
      form.value = toHyperlinkTemplateForm(detail);
      await loadImage(form.value.assetId);
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
  }

  async function save(): Promise<void> {
    if (drawerMode.value === "preview") return;
    const validationMessage = validateHyperlinkTemplateForm(form.value);
    if (validationMessage) {
      ElMessage.warning(validationMessage);
      return;
    }
    saving.value = true;
    try {
      if (form.value.imageFile) {
        const uploaded = await uploadHyperlinkTemplateImage(
          form.value.imageFile
        );
        form.value.assetId = uploaded.id;
        form.value.imageName = uploaded.originalFilename;
        form.value.imageFile = null;
      }
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
    clearImage,
    copy,
    openCreate,
    openDetail,
    refresh,
    remove,
    resetSearch,
    save,
    search,
    selectImage
  };
}
