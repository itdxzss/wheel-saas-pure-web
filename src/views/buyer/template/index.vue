<script setup lang="ts">
import { onMounted } from "vue";
import { ElMessage } from "element-plus";
import { PureTableBar } from "@/components/RePureTableBar";
import type { BuyerTemplateRow } from "@/api/buyer-template";
import BuyerTemplatePreviewDialog from "./components/BuyerTemplatePreviewDialog.vue";
import BuyerTemplateRemarkDialog from "./components/BuyerTemplateRemarkDialog.vue";
import { useBuyerTemplatePage } from "./composables/useBuyerTemplatePage";

defineOptions({ name: "BuyerTemplate" });

const {
  columns,
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
} = useBuyerTemplatePage();

function asTemplateRow(row: unknown): BuyerTemplateRow {
  return row as BuyerTemplateRow;
}

async function refreshRows(): Promise<void> {
  try {
    await refresh();
  } catch {
    ElMessage.error("模板列表加载失败");
  }
}

async function onVisibilityChange(
  row: BuyerTemplateRow,
  value: string | number | boolean
): Promise<void> {
  try {
    await changeVisibility(row, value === true);
    ElMessage.success("可见性已更新");
  } catch {
    ElMessage.error("可见性更新失败，已恢复原状态");
  }
}

async function onSaveRemark(): Promise<void> {
  try {
    await saveRemark();
    ElMessage.success("备注已更新");
    await refreshRows();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "备注更新失败");
  }
}

async function onPageSizeChange(): Promise<void> {
  page.value = 1;
  await refreshRows();
}

onMounted(() => void refreshRows());
</script>

<template>
  <div class="buyer-template-page">
    <el-alert
      v-if="errorMessage"
      :title="errorMessage"
      type="error"
      show-icon
      :closable="false"
    >
      <el-button link type="primary" @click="refreshRows">重试</el-button>
    </el-alert>
    <PureTableBar title="模板列表" :columns="columns" @refresh="refreshRows">
      <template #default="{ dynamicColumns }">
        <el-table v-loading="loading" :data="rows" row-key="id" border>
          <el-table-column
            v-if="!dynamicColumns[0]?.hide"
            label="ID"
            prop="id"
            width="80"
          />
          <el-table-column
            v-if="!dynamicColumns[1]?.hide"
            label="模板编码"
            prop="code"
            min-width="180"
            show-overflow-tooltip
          />
          <el-table-column
            v-if="!dynamicColumns[2]?.hide"
            label="模板名称"
            prop="name"
            min-width="180"
            show-overflow-tooltip
          />
          <el-table-column
            v-if="!dynamicColumns[3]?.hide"
            label="预览图"
            width="110"
            align="center"
          >
            <template #default="{ row }">
              <el-button size="small" @click="openPreview(asTemplateRow(row))">
                预览
              </el-button>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[4]?.hide"
            label="子账号可见"
            prop="subaccountVisible"
            width="130"
          >
            <template #default="{ row }">
              <el-switch
                v-auth="'tenant:buyer-template:visibility'"
                :model-value="row.subaccountVisible"
                @change="onVisibilityChange(asTemplateRow(row), $event)"
              />
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[5]?.hide"
            label="支持参数"
            prop="supportedParams"
            min-width="200"
          >
            <template #default="{ row }">
              <el-tag
                v-for="param in row.supportedParams"
                :key="param"
                class="param-tag"
                effect="plain"
              >
                {{ param }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[6]?.hide"
            label="备注"
            prop="remark"
            min-width="180"
            show-overflow-tooltip
          />
          <el-table-column
            v-if="!dynamicColumns[7]?.hide"
            label="创建时间"
            prop="createdAt"
            width="180"
          />
          <el-table-column
            v-if="!dynamicColumns[8]?.hide"
            label="更新时间"
            prop="updatedAt"
            width="180"
          />
          <el-table-column label="操作" fixed="right" width="110">
            <template #default="{ row }">
              <el-button
                v-auth="'tenant:buyer-template:remark'"
                link
                type="primary"
                @click="openRemark(asTemplateRow(row))"
              >
                编辑备注
              </el-button>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无模板" />
          </template>
        </el-table>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          class="pagination"
          :page-sizes="pageSizes"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @current-change="refreshRows"
          @size-change="onPageSizeChange"
        />
      </template>
    </PureTableBar>

    <BuyerTemplatePreviewDialog v-model="previewVisible" :row="previewRow" />
    <BuyerTemplateRemarkDialog
      v-model="remarkVisible"
      v-model:remark="remarkDraft"
      :loading="remarkSaving"
      @save="onSaveRemark"
    />
  </div>
</template>

<style scoped>
.buyer-template-page {
  padding: 16px;
}

.buyer-template-page > .el-alert {
  margin-bottom: 16px;
}

.param-tag {
  margin: 2px 4px 2px 0;
}

.pagination {
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
