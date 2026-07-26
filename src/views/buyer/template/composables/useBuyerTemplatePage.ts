import { ref } from "vue";
import {
  queryBuyerTemplates,
  updateBuyerTemplateRemark,
  updateBuyerTemplateVisibility,
  type BuyerTemplateRow
} from "@/api/buyer-template";

export interface BuyerTemplatePageServices {
  query: typeof queryBuyerTemplates;
  updateVisibility: typeof updateBuyerTemplateVisibility;
  updateRemark: typeof updateBuyerTemplateRemark;
}

const defaultServices: BuyerTemplatePageServices = {
  query: queryBuyerTemplates,
  updateVisibility: updateBuyerTemplateVisibility,
  updateRemark: updateBuyerTemplateRemark
};

export function useBuyerTemplatePage(
  services: BuyerTemplatePageServices = defaultServices
) {
  const rows = ref<BuyerTemplateRow[]>([]);
  const loading = ref(false);
  const errorMessage = ref("");
  const page = ref(1);
  const pageSize = ref(20);
  const pageSizes = [20, 50, 100];
  const total = ref(0);
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
      const result = await services.query({
        page: page.value,
        page_size: pageSize.value
      });
      rows.value = result.list;
      total.value = result.total;
      errorMessage.value = "";
    } catch (error) {
      rows.value = [];
      total.value = 0;
      errorMessage.value = "模板列表加载失败";
      throw error;
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
    errorMessage,
    loading,
    page,
    pageSize,
    pageSizes,
    previewRow,
    previewVisible,
    remarkDraft,
    remarkSaving,
    remarkVisible,
    rows,
    total,
    changeVisibility,
    openPreview,
    openRemark,
    refresh,
    saveRemark
  };
}
