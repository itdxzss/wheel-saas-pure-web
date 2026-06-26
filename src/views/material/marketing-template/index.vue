<script setup lang="ts">
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import WheelPagination from "@/components/WheelPagination/index.vue";
import Search from "~icons/ri/search-line";
import RefreshRight from "~icons/ep/refresh-right";
import Plus from "~icons/ep/plus";
import CopyDocument from "~icons/ep/copy-document";
import View from "~icons/ep/view";
import Delete from "~icons/ep/delete";
import MarketingTemplateDrawer from "./components/MarketingTemplateDrawer.vue";
import {
  type MarketingTemplateRow,
  useMarketingTemplatePage
} from "./composables/useMarketingTemplatePage";

defineOptions({
  name: "TaskMarketingTemplate"
});

const {
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
} = useMarketingTemplatePage();

function linkModeLabel(mode: MarketingTemplateRow["linkMode"]) {
  return mode === "BUTTON" ? "按钮超链" : "普通超链";
}

function promotionHref(value: string) {
  return /^https?:\/\//.test(value) ? value : undefined;
}

function asMarketingTemplateRow(row: unknown): MarketingTemplateRow {
  return row as MarketingTemplateRow;
}
</script>

<template>
  <div class="marketing-template-page">
    <div class="marketing-template-search bg-bg_color">
      <el-form :model="searchForm" inline>
        <el-form-item label="ID">
          <el-input
            v-model="searchForm.id"
            clearable
            class="search-id"
            placeholder="精准 ID"
            @keyup.enter="searchTemplates"
          />
        </el-form-item>
        <el-form-item label="模板名称">
          <el-input
            v-model="searchForm.keyword"
            clearable
            class="search-keyword"
            placeholder="输入模板名称关键词"
            @keyup.enter="searchTemplates"
          />
        </el-form-item>
        <el-form-item label="文本类型">
          <el-select
            v-model="searchForm.linkMode"
            clearable
            class="search-select"
            placeholder="全部类型"
          >
            <el-option label="普通超链" value="NORMAL" />
            <el-option label="按钮超链" value="BUTTON" />
          </el-select>
        </el-form-item>
        <el-form-item v-show="advancedOpen" label="推广链接">
          <el-input
            v-model="searchForm.promotionLink"
            clearable
            disabled
            class="search-keyword"
            placeholder="二期支持"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="useRenderIcon(Search)"
            @click="searchTemplates"
          >
            查询
          </el-button>
          <el-button
            :icon="useRenderIcon(RefreshRight)"
            @click="resetSearchForm"
          >
            重置
          </el-button>
          <el-button text type="primary" @click="toggleAdvanced">
            {{ advancedOpen ? "收起搜索条件" : "展开搜索条件" }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-alert
      v-if="errorMessage"
      class="marketing-template-error"
      type="error"
      show-icon
      :closable="false"
      :title="errorMessage"
    />

    <PureTableBar
      title="营销模版"
      :columns="columns"
      @refresh="refreshTemplates"
    >
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(Plus)"
          @click="openCreateDrawer"
        >
          新增营销模板
        </el-button>
        <el-button
          :disabled="!hasSelection"
          :icon="useRenderIcon(CopyDocument)"
          @click="notifyApiPending('复制营销模版')"
        >
          复制
        </el-button>
        <el-button
          :disabled="!canPreviewSelected"
          :icon="useRenderIcon(View)"
          @click="previewSelected"
        >
          预览
        </el-button>
        <el-button
          type="danger"
          plain
          :disabled="!hasSelection"
          :icon="useRenderIcon(Delete)"
          @click="notifyApiPending('批量删除营销模版')"
        >
          批量删除
        </el-button>
      </template>

      <template #default="{ dynamicColumns }">
        <el-table
          v-loading="loading"
          :data="rows"
          row-key="id"
          border
          @selection-change="onSelectionChange"
        >
          <el-table-column type="selection" width="48" />
          <el-table-column
            v-if="!dynamicColumns[0].hide"
            prop="id"
            label="ID"
            width="90"
          />
          <el-table-column
            v-if="!dynamicColumns[1].hide"
            prop="templateName"
            label="模板名称"
            min-width="180"
            show-overflow-tooltip
          />
          <el-table-column
            v-if="!dynamicColumns[2].hide"
            prop="linkMode"
            label="文本类型"
            width="130"
          >
            <template #default="{ row }">
              <el-tag
                :type="row.linkMode === 'BUTTON' ? 'success' : 'primary'"
                effect="plain"
              >
                {{ linkModeLabel(row.linkMode) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[3].hide"
            prop="promotionLink"
            label="推广链接"
            min-width="220"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <el-link
                v-if="promotionHref(row.promotionLink)"
                type="primary"
                :href="promotionHref(row.promotionLink)"
                target="_blank"
                :underline="false"
              >
                {{ row.promotionLink }}
              </el-link>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[4].hide"
            prop="referenceTaskCount"
            label="引用任务数"
            width="120"
          />
          <el-table-column
            v-if="!dynamicColumns[5].hide"
            prop="enabled"
            label="状态"
            width="100"
          >
            <template #default="{ row }">
              <el-tag :type="row.enabled ? 'success' : 'info'" effect="plain">
                {{ row.enabled ? "启用" : "停用" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="130">
            <template #default="{ row }">
              <el-button
                link
                type="primary"
                @click="openEditDrawer(asMarketingTemplateRow(row))"
              >
                编辑
              </el-button>
              <el-button
                link
                type="primary"
                @click="openPreviewDrawer(asMarketingTemplateRow(row))"
              >
                预览
              </el-button>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无符合条件的营销模板" />
          </template>
        </el-table>

        <WheelPagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
        />
      </template>
    </PureTableBar>

    <MarketingTemplateDrawer
      v-model="drawerVisible"
      v-model:form="templateForm"
      :mode="drawerMode"
      :title="drawerTitle"
      @save="notifyApiPending('保存营销模版')"
    />
  </div>
</template>

<style scoped>
.marketing-template-page {
  padding: 16px;
}

.marketing-template-search {
  margin-bottom: 8px;
  padding: 16px 16px 0;
  border-radius: 4px;
}

.marketing-template-search :deep(.el-form-item) {
  margin-right: 16px;
  margin-bottom: 16px;
}

.search-id {
  width: 160px;
}

.search-keyword {
  width: 260px;
}

.search-select {
  width: 160px;
}

.marketing-template-error {
  margin-bottom: 8px;
}
</style>
