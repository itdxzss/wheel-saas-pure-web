import { computed, ref } from "vue";
import { ElMessage } from "element-plus";

export type MarketingLinkMode = "NORMAL" | "BUTTON";
export type MarketingDrawerMode = "create" | "edit" | "preview";
export type MarketingButtonType = "link" | "phone" | "copy" | "quick";

export interface MarketingTemplateRow {
  id: number;
  templateName: string;
  linkMode: MarketingLinkMode;
  promotionLink: string;
  referenceTaskCount: number;
  enabled: boolean;
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
  imageName: string;
  imageUrl: string;
  content: string;
  text: string;
  promotionLink: string;
  buttons: MarketingTemplateButton[];
  enabled: boolean;
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
  imageName: "",
  imageUrl: "",
  content: "",
  text: "",
  promotionLink: "https://promo.example/vip",
  buttons: defaultButtons(),
  enabled: true
});

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

  const columns: TableColumnList = [
    { label: "ID", prop: "id", width: 90 },
    { label: "模板名称", prop: "templateName", minWidth: 180 },
    { label: "文本类型", prop: "linkMode", width: 130 },
    { label: "推广链接", prop: "promotionLink", minWidth: 220 },
    { label: "引用任务数", prop: "referenceTaskCount", width: 120 },
    { label: "状态", prop: "enabled", width: 100 }
  ];

  const drawerTitle = computed(() => {
    if (drawerMode.value === "edit") return "编辑营销模版";
    if (drawerMode.value === "preview") return "预览营销模版";
    return "新增营销模版";
  });

  const hasSelection = computed(() => selectedRows.value.length > 0);
  const canPreviewSelected = computed(() => selectedRows.value.length === 1);

  function refreshTemplates() {
    selectedRows.value = [];
    loading.value = false;
  }

  function searchTemplates() {
    page.value = 1;
    refreshTemplates();
  }

  function resetSearchForm() {
    searchForm.value = {
      id: "",
      keyword: "",
      linkMode: "",
      promotionLink: ""
    };
    searchTemplates();
  }

  function toggleAdvanced() {
    advancedOpen.value = !advancedOpen.value;
  }

  function onSelectionChange(selection: MarketingTemplateRow[]) {
    selectedRows.value = selection;
  }

  function openCreateDrawer() {
    templateForm.value = emptyForm();
    drawerMode.value = "create";
    drawerVisible.value = true;
  }

  function openEditDrawer(row: MarketingTemplateRow) {
    templateForm.value = {
      ...emptyForm(),
      templateName: row.templateName,
      linkMode: row.linkMode,
      promotionLink: row.promotionLink,
      enabled: row.enabled
    };
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

  function notifyApiPending(action: string) {
    ElMessage.warning(`${action}需要接入真实营销模版 API 后启用`);
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
    searchForm,
    selectedRows,
    templateForm,
    total,
    notifyApiPending,
    onSelectionChange,
    openCreateDrawer,
    openEditDrawer,
    openPreviewDrawer,
    previewSelected,
    refreshTemplates,
    resetSearchForm,
    searchTemplates,
    toggleAdvanced
  };
}
