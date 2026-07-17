import { ref } from "vue";
import {
  listBuyerTemplates,
  updateBuyerTemplateRemark,
  updateBuyerTemplateVisibility,
  type BuyerTemplateRow
} from "@/api/buyer-template";

export interface BuyerTemplatePageServices {
  list: typeof listBuyerTemplates;
  updateVisibility: typeof updateBuyerTemplateVisibility;
  updateRemark: typeof updateBuyerTemplateRemark;
}

const defaultServices: BuyerTemplatePageServices = {
  list: listBuyerTemplates,
  updateVisibility: updateBuyerTemplateVisibility,
  updateRemark: updateBuyerTemplateRemark
};

export function useBuyerTemplatePage(
  services: BuyerTemplatePageServices = defaultServices
) {
  const rows = ref<BuyerTemplateRow[]>([]);
  const loading = ref(false);
  const previewVisible = ref(false);
  const previewRow = ref<BuyerTemplateRow | null>(null);
  const remarkVisible = ref(false);
  const remarkDraft = ref("");
  const remarkSaving = ref(false);
  const editingRemarkRow = ref<BuyerTemplateRow | null>(null);

  const columns = [
    { label: "ID", prop: "id", width: 80 },
    { label: "模板编码", prop: "code", minWidth: 180 },
    { label: "模板名称", prop: "name", minWidth: 180 },
    { label: "预览图", prop: "previewUrl", width: 110 },
    { label: "子账号可见", prop: "subaccountVisible", width: 130 },
    { label: "支持参数", prop: "supportedParams", minWidth: 200 },
    { label: "备注", prop: "remark", minWidth: 180 },
    { label: "创建时间", prop: "createdAt", width: 180 },
    { label: "更新时间", prop: "updatedAt", width: 180 }
  ];

  async function refresh(): Promise<void> {
    loading.value = true;
    try {
      rows.value = await services.list();
    } finally {
      loading.value = false;
    }
  }

  function openPreview(row: BuyerTemplateRow): void {
    previewRow.value = row;
    previewVisible.value = true;
  }

  async function changeVisibility(
    row: BuyerTemplateRow,
    visible: boolean
  ): Promise<void> {
    const previous = row.subaccountVisible;
    row.subaccountVisible = visible;
    try {
      await services.updateVisibility(row.id, visible);
    } catch (error) {
      row.subaccountVisible = previous;
      throw error;
    }
  }

  function openRemark(row: BuyerTemplateRow): void {
    editingRemarkRow.value = row;
    remarkDraft.value = row.remark ?? "";
    remarkVisible.value = true;
  }

  async function saveRemark(): Promise<void> {
    const row = editingRemarkRow.value;
    if (!row) return;
    const remark = remarkDraft.value.trim();
    if (remark.length > 500) {
      throw new RangeError("备注不能超过 500 个字符");
    }
    remarkSaving.value = true;
    try {
      await services.updateRemark(row.id, remark);
      row.remark = remark;
      remarkVisible.value = false;
    } finally {
      remarkSaving.value = false;
    }
  }

  return {
    columns,
    editingRemarkRow,
    loading,
    previewRow,
    previewVisible,
    remarkDraft,
    remarkSaving,
    remarkVisible,
    rows,
    changeVisibility,
    openPreview,
    openRemark,
    refresh,
    saveRemark
  };
}
