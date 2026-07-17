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
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "备注更新失败");
  }
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
            prop="previewUrl"
            width="110"
          >
            <template #default="{ row }">
              <el-image
                class="thumbnail"
                :src="row.previewUrl"
                fit="cover"
                @click="openPreview(asTemplateRow(row))"
              />
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
          <el-table-column label="操作" fixed="right" width="150">
            <template #default="{ row }">
              <el-button
                link
                type="primary"
                @click="openPreview(asTemplateRow(row))"
              >
                预览
              </el-button>
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

.thumbnail {
  width: 56px;
  height: 56px;
  cursor: pointer;
  border-radius: 4px;
}

.param-tag {
  margin: 2px 4px 2px 0;
}
</style>
