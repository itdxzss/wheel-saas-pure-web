import { computed, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  batchDeleteMarketingTemplates,
  cloneMarketingTemplate,
  createMarketingTemplate,
  listMarketingTemplates,
  updateMarketingTemplate,
  type MarketingTemplateRow as ApiMarketingTemplateRow,
  type MarketingTemplateWrite
} from "@/api/marketing-template";
import { apiErrorMessage } from "@/utils/api-error";

export type MarketingLinkMode = "NORMAL" | "BUTTON";
export type MarketingDrawerMode = "create" | "edit" | "preview";
export type MarketingButtonType = "link" | "phone" | "copy" | "quick";

export interface MarketingTemplateRow {
  id: number;
  templateName: string;
  linkMode: MarketingLinkMode;
  promotionLink: string;
  textType?: string | null;
  imageFileId?: number | null;
  content: string;
  text: string;
  buttons: MarketingTemplateButton[];
  remark?: string | null;
}

export interface MarketingTemplateSearchForm {
  id: string;
  keyword: string;
  linkMode: "" | MarketingLinkMode;
  promotionLink: string;
}

export interface MarketingTemplateButton {
  id: number;
  type: MarketingButtonType;
  label: string;
  value: string;
}

export interface MarketingTemplateForm {
  templateName: string;
  linkMode: MarketingLinkMode;
  textType: string;
  imageFileId: number | null;
  imageName: string;
  imageUrl: string;
  content: string;
  text: string;
  promotionLink: string;
  buttons: MarketingTemplateButton[];
  remark: string;
}

let nextButtonId = 1;

function createButton(
  type: MarketingButtonType,
  label: string,
  value = ""
): MarketingTemplateButton {
  const button = {
    id: nextButtonId,
    type,
    label,
    value
  };
  nextButtonId += 1;
  return button;
}

function defaultButtons(): MarketingTemplateButton[] {
  return [
    createButton("phone", "立即咨询", "+8613800138000"),
    createButton("copy", "复制优惠码", "VIP88"),
    createButton("quick", "我要参加")
  ];
}

const emptyForm = (): MarketingTemplateForm => ({
  templateName: "",
  linkMode: "NORMAL",
  textType: "PROMO",
  imageFileId: null,
  imageName: "",
  imageUrl: "",
  content: "",
  text: "",
  promotionLink: "",
  buttons: defaultButtons(),
  remark: ""
});

function fromApiLinkMode(linkMode: ApiMarketingTemplateRow["linkMode"]) {
  return linkMode === 2 ? "BUTTON" : "NORMAL";
}

function toApiLinkMode(linkMode: MarketingLinkMode) {
  return linkMode === "BUTTON" ? 2 : 1;
}

function parseSearchId(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function toPageButton(
  button: ApiMarketingTemplateRow["buttons"][number]
): MarketingTemplateButton {
  return createButton(button.type, button.label, button.value);
}

function toPageRow(row: ApiMarketingTemplateRow): MarketingTemplateRow {
  return {
    id: row.id,
    templateName: row.templateName,
    linkMode: fromApiLinkMode(row.linkMode),
    promotionLink: row.promotionLink ?? "",
    textType: row.textType ?? "PROMO",
    imageFileId: row.imageFileId ?? null,
    content: row.content ?? "",
    text: row.bodyText ?? "",
    buttons: row.buttons.map(toPageButton),
    remark: row.remark ?? ""
  };
}

function toForm(row: MarketingTemplateRow): MarketingTemplateForm {
  return {
    ...emptyForm(),
    templateName: row.templateName,
    linkMode: row.linkMode,
    textType: row.textType ?? "PROMO",
    imageFileId: row.imageFileId ?? null,
    content: row.content,
    text: row.text,
    promotionLink: row.promotionLink,
    buttons:
      row.buttons.length > 0
        ? row.buttons.map(button =>
            createButton(button.type, button.label, button.value)
          )
        : defaultButtons(),
    remark: row.remark ?? ""
  };
}

function toWritePayload(form: MarketingTemplateForm): MarketingTemplateWrite {
  return {
    templateName: form.templateName.trim(),
    linkMode: toApiLinkMode(form.linkMode),
    textType: form.textType || null,
    imageFileId: form.imageFileId,
    content: form.content.trim(),
    bodyText: form.text.trim(),
    buttons:
      form.linkMode === "BUTTON"
        ? form.buttons.map(button => ({
            type: button.type,
            label: button.label.trim(),
            value: button.value.trim()
          }))
        : [],
    promotionLink: form.promotionLink.trim() || null,
    remark: form.remark.trim() || null
  };
}

function validateForm(form: MarketingTemplateForm): string {
  if (!form.templateName.trim()) return "请填写模版名称";
  if (!form.content.trim()) return "请填写内容";
  if (!form.text.trim()) return "请填写文本";
  if (form.linkMode === "BUTTON") {
    if (form.buttons.length === 0) return "按钮超链至少需要一个按钮";
    const invalidButton = form.buttons.find(button => !button.label.trim());
    if (invalidButton) return "请填写按钮文字";
  }
  return "";
}

function showMessage(
  type: "success" | "warning" | "error",
  text: string
): void {
  if (typeof document === "undefined") return;
  ElMessage[type](text);
}

async function confirmDelete(count: number): Promise<boolean> {
  if (typeof document === "undefined") return true;
  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${count} 个营销模版？`,
      "删除营销模版",
      {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消"
      }
    );
    return true;
  } catch {
    return false;
  }
}

export function useMarketingTemplatePage() {
  const searchForm = ref<MarketingTemplateSearchForm>({
    id: "",
    keyword: "",
    linkMode: "",
    promotionLink: ""
  });
  const templateForm = ref<MarketingTemplateForm>(emptyForm());
  const rows = ref<MarketingTemplateRow[]>([]);
  const selectedRows = ref<MarketingTemplateRow[]>([]);
  const loading = ref(false);
  const advancedOpen = ref(false);
  const drawerVisible = ref(false);
  const drawerMode = ref<MarketingDrawerMode>("create");
  const page = ref(1);
  const pageSize = ref(10);
  const total = ref(0);
  const errorMessage = ref("");
  const editingId = ref<number | null>(null);
  const saving = ref(false);

  const columns: TableColumnList = [
    { label: "ID", prop: "id", width: 90 },
    { label: "模板名称", prop: "templateName", minWidth: 180 },
    { label: "文本类型", prop: "linkMode", width: 130 },
    { label: "推广链接", prop: "promotionLink", minWidth: 220 }
  ];

  const drawerTitle = computed(() => {
    if (drawerMode.value === "edit") return "编辑营销模版";
    if (drawerMode.value === "preview") return "预览营销模版";
    return "新增营销模版";
  });

  const hasSelection = computed(() => selectedRows.value.length > 0);
  const canPreviewSelected = computed(() => selectedRows.value.length === 1);

  async function refreshTemplates(): Promise<void> {
    selectedRows.value = [];
    loading.value = true;
    errorMessage.value = "";
    try {
      const result = await listMarketingTemplates({
        page: page.value,
        pageSize: pageSize.value,
        id: parseSearchId(searchForm.value.id),
        keyword: searchForm.value.keyword.trim() || undefined,
        linkMode: searchForm.value.linkMode
          ? toApiLinkMode(searchForm.value.linkMode)
          : ""
      });
      rows.value = (result.list ?? []).map(toPageRow);
      total.value = result.total ?? rows.value.length;
      if (result.page) page.value = result.page;
      if (result.pageSize) pageSize.value = result.pageSize;
    } catch (error) {
      rows.value = [];
      total.value = 0;
      errorMessage.value = apiErrorMessage(error, "营销模版加载失败");
    } finally {
      loading.value = false;
    }
  }

  async function searchTemplates(): Promise<void> {
    page.value = 1;
    await refreshTemplates();
  }

  async function resetSearchForm(): Promise<void> {
    searchForm.value = {
      id: "",
      keyword: "",
      linkMode: "",
      promotionLink: ""
    };
    await searchTemplates();
  }

  function toggleAdvanced() {
    advancedOpen.value = !advancedOpen.value;
  }

  function onSelectionChange(selection: MarketingTemplateRow[]) {
    selectedRows.value = selection;
  }

  function openCreateDrawer() {
    templateForm.value = emptyForm();
    editingId.value = null;
    drawerMode.value = "create";
    drawerVisible.value = true;
  }

  function openEditDrawer(row: MarketingTemplateRow) {
    templateForm.value = toForm(row);
    editingId.value = row.id;
    drawerMode.value = "edit";
    drawerVisible.value = true;
  }

  function openPreviewDrawer(row: MarketingTemplateRow) {
    openEditDrawer(row);
    drawerMode.value = "preview";
  }

  function previewSelected() {
    const [row] = selectedRows.value;
    if (!row || selectedRows.value.length !== 1) return;
    openPreviewDrawer(row);
  }

  async function saveTemplate(): Promise<void> {
    if (drawerMode.value === "preview") return;
    const validation = validateForm(templateForm.value);
    if (validation) {
      showMessage("warning", validation);
      return;
    }
    saving.value = true;
    try {
      const payload = toWritePayload(templateForm.value);
      if (editingId.value) {
        await updateMarketingTemplate(editingId.value, payload);
      } else {
        await createMarketingTemplate(payload);
      }
      showMessage(
        "success",
        editingId.value ? "营销模版已更新" : "营销模版已创建"
      );
      drawerVisible.value = false;
      editingId.value = null;
      await refreshTemplates();
    } catch (error) {
      showMessage("error", apiErrorMessage(error, "营销模版保存失败"));
    } finally {
      saving.value = false;
    }
  }

  async function cloneSelected(): Promise<void> {
    if (selectedRows.value.length === 0) return;
    try {
      await Promise.all(
        selectedRows.value.map(row => cloneMarketingTemplate(row.id))
      );
      showMessage("success", "营销模版已复制");
      await refreshTemplates();
    } catch (error) {
      showMessage("error", apiErrorMessage(error, "营销模版复制失败"));
    }
  }

  async function deleteSelected(): Promise<void> {
    if (selectedRows.value.length === 0) return;
    const confirmed = await confirmDelete(selectedRows.value.length);
    if (!confirmed) return;
    try {
      await batchDeleteMarketingTemplates(
        selectedRows.value.map(row => row.id)
      );
      showMessage("success", "营销模版已删除");
      await refreshTemplates();
    } catch (error) {
      showMessage("error", apiErrorMessage(error, "营销模版删除失败"));
    }
  }

  return {
    advancedOpen,
    canPreviewSelected,
    columns,
    drawerMode,
    drawerTitle,
    drawerVisible,
    errorMessage,
    hasSelection,
    loading,
    page,
    pageSize,
    rows,
    saving,
    searchForm,
    selectedRows,
    templateForm,
    total,
    cloneSelected,
    deleteSelected,
    onSelectionChange,
    openCreateDrawer,
    openEditDrawer,
    openPreviewDrawer,
    previewSelected,
    refreshTemplates,
    resetSearchForm,
    saveTemplate,
    searchTemplates,
    toggleAdvanced
  };
}
