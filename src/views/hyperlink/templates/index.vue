<script setup lang="ts">
import { computed, onMounted } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import WheelPagination from "@/components/WheelPagination/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { formatEpochMillis } from "@/utils/time";
import type {
  HyperlinkMessageType,
  HyperlinkTemplateListItem,
  SupportedHyperlinkMessageType
} from "@/api/hyperlink-template";
import RefreshRight from "~icons/ep/refresh-right";
import Plus from "~icons/ep/plus";
import Edit from "~icons/ep/edit";
import CopyDocument from "~icons/ep/copy-document";
import Delete from "~icons/ep/delete";
import Library from "~icons/solar/library-bold-duotone";
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

const buttonTemplateCount = computed(
  () =>
    rows.value.filter(row => row.messageType === 3 || row.messageType === 4)
      .length
);

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

function changeSearchMessageType(
  value: string | number | boolean | undefined
): void {
  searchForm.value.messageType =
    value === "all" ? "" : (Number(value) as SupportedHyperlinkMessageType);
  void search();
}

onMounted(() => {
  void refresh();
});
</script>

<template>
  <div class="hyperlink-template-page">
    <el-card shadow="never" class="intro-card">
      <div class="intro-content">
        <component :is="useRenderIcon(Library)" class="intro-icon" />
        <div>
          <div class="intro-title">
            WhatsApp 超链模板
            <el-tag type="success" effect="plain" round>Hyperlink</el-tag>
          </div>
          <p>
            预先编排好 <b>消息类型 + 文案 + 图片 + 按钮</b>
            的超链消息模板；新建超链群发任务时可一键引用，无需每个任务重写。编辑时可实时预览
            WhatsApp 真机效果。
          </p>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="stats-card">
      <div class="template-stats">
        <div class="stat-item">
          <span>模板总数</span>
          <strong>{{ total.toLocaleString() }}</strong>
        </div>
        <el-divider direction="vertical" />
        <div class="stat-item">
          <span>本页按钮模板</span>
          <strong class="success-value">{{
            buttonTemplateCount.toLocaleString()
          }}</strong>
        </div>
        <el-tooltip content="模板总数来自当前筛选条件；按钮模板仅统计本页数据">
          <span class="stat-tip">?</span>
        </el-tooltip>
      </div>
    </el-card>

    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="模板名称">
          <el-input
            v-model="searchForm.name"
            clearable
            class="name-input"
            maxlength="128"
            placeholder="按模板名称搜索"
            @blur="search"
            @keyup.enter="search"
          />
        </el-form-item>
        <el-form-item label="消息类型">
          <el-radio-group
            :model-value="searchForm.messageType || 'all'"
            @change="changeSearchMessageType"
          >
            <el-radio-button value="all">全部</el-radio-button>
            <el-radio-button
              v-for="option in hyperlinkMessageTypeOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button :icon="useRenderIcon(RefreshRight)" @click="resetSearch">
            重置
          </el-button>
        </el-form-item>
        <el-form-item class="create-action">
          <el-button
            v-auth="'tenant:hyperlink_template:create'"
            type="primary"
            :icon="useRenderIcon(Plus)"
            @click="openCreate"
          >
            新建超链模板
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

    <PureTableBar title="超链模板" :columns="columns" @refresh="refresh">
      <template #title>
        <div class="table-title">
          <span>模板管理</span>
          <el-tag effect="light" round>本页 {{ rows.length }} 个</el-tag>
        </div>
      </template>
      <template #default="{ dynamicColumns }">
        <el-table v-loading="loading" :data="rows" row-key="id" size="small">
          <el-table-column
            v-if="!dynamicColumns[0].hide"
            prop="name"
            label="模板名称 / 类型"
            min-width="260"
          >
            <template #default="{ row }">
              <div class="template-name-cell">
                <div class="template-name-line">
                  <span class="template-name">
                    {{
                      asTemplateRow(row).name ||
                      `模板 #${asTemplateRow(row).id}`
                    }}
                  </span>
                  <el-tag
                    :type="typeTag(asTemplateRow(row).messageType)"
                    effect="plain"
                    size="small"
                    round
                  >
                    {{
                      hyperlinkMessageTypeLabel(asTemplateRow(row).messageType)
                    }}
                  </el-tag>
                </div>
                <span class="template-id">#{{ asTemplateRow(row).id }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[1].hide"
            prop="updatedAt"
            label="更新时间"
            width="178"
            align="center"
          >
            <template #default="{ row }">
              {{ formatEpochMillis(asTemplateRow(row).updatedAt) }}
            </template>
          </el-table-column>
          <el-table-column
            label="操作"
            fixed="right"
            width="190"
            align="center"
          >
            <template #default="{ row }">
              <el-button
                v-auth="'tenant:hyperlink_template:edit'"
                link
                type="primary"
                :icon="useRenderIcon(Edit)"
                @click="openDetail(asTemplateRow(row))"
              >
                编辑
              </el-button>
              <el-button
                v-auth="'tenant:hyperlink_template:copy'"
                link
                type="warning"
                :icon="useRenderIcon(CopyDocument)"
                @click="copy(asTemplateRow(row))"
              >
                复制
              </el-button>
              <el-tooltip
                :disabled="asTemplateRow(row).taskRefCount === 0"
                :content="`仍被 ${asTemplateRow(row).taskRefCount} 个任务引用，不能删除`"
              >
                <span>
                  <el-button
                    v-auth="'tenant:hyperlink_template:delete'"
                    link
                    type="danger"
                    :icon="useRenderIcon(Delete)"
                    :disabled="asTemplateRow(row).taskRefCount > 0"
                    @click="remove(asTemplateRow(row))"
                  >
                    删除
                  </el-button>
                </span>
              </el-tooltip>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无符合条件的超链模板" />
          </template>
        </el-table>

        <WheelPagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          @change="refresh"
        />
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

.intro-card,
.stats-card,
.search-card,
.error-alert {
  margin-bottom: 12px;
}

.intro-content,
.intro-title,
.template-stats,
.template-name-line {
  display: flex;
  align-items: center;
}

.intro-content {
  gap: 14px;
  align-items: flex-start;
}

.intro-icon {
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  margin-top: 1px;
  color: var(--el-color-primary);
}

.intro-title {
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
}

.intro-content p {
  margin: 8px 0 0;
  line-height: 1.8;
  color: var(--el-text-color-secondary);
}

.stats-card :deep(.el-card__body) {
  padding: 16px 20px;
}

.template-stats {
  gap: 24px;
}

.stat-item {
  display: flex;
  gap: 10px;
  align-items: baseline;
  color: var(--el-text-color-secondary);
}

.stat-item strong {
  font-size: 24px;
  color: var(--el-text-color-primary);
}

.stat-item .success-value {
  color: var(--el-color-success);
}

.stat-tip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  color: var(--el-text-color-secondary);
  cursor: help;
  border: 1px solid var(--el-border-color);
  border-radius: 50%;
}

.search-card :deep(.el-card__body) {
  padding-bottom: 2px;
}

.search-card :deep(.el-form) {
  display: flex;
}

.name-input {
  width: 240px;
}

.create-action {
  margin-left: auto;
}

.table-title {
  display: flex;
  gap: 10px;
  align-items: center;
  font-weight: 700;
}

.template-name-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.template-name-line {
  flex-wrap: wrap;
  gap: 6px;
}

.template-name {
  font-weight: 600;
}

.template-id {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

@media (width <= 900px) {
  .intro-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .create-action {
    margin-left: 0;
  }

  .search-card :deep(.el-form) {
    display: block;
  }

  .template-stats {
    flex-wrap: wrap;
  }
}
</style>
