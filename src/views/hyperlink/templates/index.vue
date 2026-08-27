<script setup lang="ts">
import { onMounted } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { formatEpochMillis } from "@/utils/time";
import type {
  HyperlinkMessageType,
  HyperlinkTemplateListItem
} from "@/api/hyperlink-template";
import Search from "~icons/ri/search-line";
import RefreshRight from "~icons/ep/refresh-right";
import Plus from "~icons/ep/plus";
import HyperlinkTemplateDrawer from "./components/HyperlinkTemplateDrawer.vue";
import { useHyperlinkTemplatePage } from "./composables/useHyperlinkTemplatePage";
import {
  hyperlinkMessageTypeLabel,
  hyperlinkMessageTypeOptions
} from "./domain/template-form";

defineOptions({ name: "HyperlinkMarketingTemplates" });

const {
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
} = useHyperlinkTemplatePage();

function asTemplateRow(row: unknown): HyperlinkTemplateListItem {
  return row as HyperlinkTemplateListItem;
}

function typeTag(
  type: HyperlinkMessageType
): "primary" | "success" | "warning" | "info" {
  if (type === 1) return "primary";
  if (type === 3) return "success";
  if (type === 4) return "warning";
  return "info";
}

onMounted(() => {
  void refresh();
});
</script>

<template>
  <div class="hyperlink-template-page">
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="模板名称">
          <el-input
            v-model="searchForm.name"
            clearable
            class="name-input"
            maxlength="128"
            placeholder="输入模板名称关键词"
            @keyup.enter="search"
          />
        </el-form-item>
        <el-form-item label="消息类型">
          <el-select
            v-model="searchForm.messageType"
            clearable
            class="type-select"
            placeholder="全部类型"
          >
            <el-option
              v-for="option in hyperlinkMessageTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="searchForm.createdRange"
            type="datetimerange"
            value-format="x"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            range-separator="至"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="useRenderIcon(Search)"
            @click="search"
          >
            查询
          </el-button>
          <el-button :icon="useRenderIcon(RefreshRight)" @click="resetSearch">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-alert
      v-if="errorMessage"
      class="error-alert"
      type="error"
      show-icon
      :closable="false"
      :title="errorMessage"
    >
      <el-button link type="primary" @click="refresh">重试</el-button>
    </el-alert>

    <PureTableBar title="超链营销模板" :columns="columns" @refresh="refresh">
      <template #buttons>
        <el-button
          v-auth="'tenant:hyperlink_template:create'"
          type="primary"
          :icon="useRenderIcon(Plus)"
          @click="openCreate"
        >
          创建模板
        </el-button>
      </template>

      <template #default="{ dynamicColumns }">
        <el-table v-loading="loading" :data="rows" row-key="id" border>
          <el-table-column
            v-if="!dynamicColumns[0].hide"
            prop="id"
            label="ID"
            width="90"
          />
          <el-table-column
            v-if="!dynamicColumns[1].hide"
            prop="name"
            label="模板名称"
            min-width="180"
            show-overflow-tooltip
          />
          <el-table-column
            v-if="!dynamicColumns[2].hide"
            prop="messageType"
            label="消息类型"
            width="120"
          >
            <template #default="{ row }">
              <el-tag :type="typeTag(row.messageType)" effect="plain">
                {{ hyperlinkMessageTypeLabel(row.messageType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[3].hide"
            prop="title"
            label="标题"
            min-width="180"
            show-overflow-tooltip
          />
          <el-table-column
            v-if="!dynamicColumns[4].hide"
            prop="taskRefCount"
            label="任务引用"
            width="100"
            align="right"
          />
          <el-table-column
            v-if="!dynamicColumns[5].hide"
            prop="version"
            label="版本"
            width="90"
            align="right"
          />
          <el-table-column
            v-if="!dynamicColumns[6].hide"
            prop="updatedAt"
            label="更新时间"
            width="180"
          >
            <template #default="{ row }">{{
              formatEpochMillis(row.updatedAt)
            }}</template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="245">
            <template #default="{ row }">
              <el-button
                v-auth="'tenant:hyperlink_template:view'"
                link
                type="primary"
                @click="openDetail(asTemplateRow(row), 'preview')"
              >
                详情/预览
              </el-button>
              <el-button
                v-auth="'tenant:hyperlink_template:edit'"
                link
                type="primary"
                @click="openDetail(asTemplateRow(row), 'edit')"
              >
                编辑
              </el-button>
              <el-button
                v-auth="'tenant:hyperlink_template:copy'"
                link
                type="primary"
                @click="copy(asTemplateRow(row))"
              >
                复制
              </el-button>
              <el-button
                v-auth="'tenant:hyperlink_template:delete'"
                link
                type="danger"
                @click="remove(asTemplateRow(row))"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无符合条件的超链营销模板" />
          </template>
        </el-table>

        <div class="pagination">
          <el-pagination
            v-model:current-page="page"
            :page-size="pageSize"
            background
            layout="total, prev, pager, next, jumper"
            :total="total"
            @current-change="refresh"
          />
        </div>
      </template>
    </PureTableBar>

    <HyperlinkTemplateDrawer
      v-model="drawerVisible"
      v-model:form="form"
      :mode="drawerMode"
      :title="drawerTitle"
      :loading="saving"
      :detail-loading="detailLoading"
      :image-loading="imageLoading"
      :on-image-select="selectImage"
      @save="save"
      @clear-image="clearImage"
      @message-type-change="changeMessageType"
    />
  </div>
</template>

<style scoped>
.hyperlink-template-page {
  padding: 16px;
}

.search-card,
.error-alert {
  margin-bottom: 8px;
}

.search-card :deep(.el-card__body) {
  padding-bottom: 2px;
}

.name-input {
  width: 240px;
}

.type-select {
  width: 160px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
