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
import SummaryChart from "~icons/solar/pie-chart-2-bold-duotone";
import InfoCircle from "~icons/ep/info-filled";
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
  copy,
  openCreate,
  openDetail,
  refresh,
  remove,
  resetSearch,
  save,
  search
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

    <section class="condition-summary" aria-label="当前条件汇总">
      <div class="summary-strip">
        <div class="summary-head">
          <component
            :is="useRenderIcon(SummaryChart)"
            class="summary-head-icon"
          />
          <span>当前条件汇总</span>
          <el-tooltip
            content="模板总数来自当前筛选条件的分页汇总；按钮模板仅统计本页已加载的普通按钮与卡片按钮模板。"
            placement="top"
          >
            <component
              :is="useRenderIcon(InfoCircle)"
              class="summary-head-tip"
            />
          </el-tooltip>
        </div>
        <div class="summary-list">
          <div class="summary-item">
            <span class="summary-label">模板总数</span>
            <strong class="summary-value summary-value--neutral">
              {{ total.toLocaleString() }}
            </strong>
          </div>
          <span class="summary-separator" aria-hidden="true" />
          <div class="summary-item">
            <span class="summary-label">本页按钮模板</span>
            <strong
              class="summary-value"
              :class="
                buttonTemplateCount > 0
                  ? 'summary-value--success'
                  : 'summary-value--muted'
              "
            >
              {{ buttonTemplateCount.toLocaleString() }}
            </strong>
          </div>
        </div>
      </div>
    </section>

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

    <PureTableBar
      class="template-table-card"
      style="margin-top: 0"
      title="超链模板"
      :columns="columns"
      @refresh="refresh"
    >
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
      @save="save"
      @message-type-change="changeMessageType"
    />
  </div>
</template>

<style scoped>
.hyperlink-template-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 500px;
  padding: 0;
}

.hyperlink-template-page.main-content {
  margin: 16px !important;
}

.intro-content,
.intro-title,
.template-name-line {
  display: flex;
  align-items: center;
}

.intro-content {
  gap: 14px;
  align-items: flex-start;
}

.intro-card {
  color: #fff;
  background: linear-gradient(105deg, #409eff 0%, #2f8cff 48%, #1d6fd9 100%);
  border: 0;
  box-shadow: 0 8px 22px rgb(47 140 255 / 18%);
}

.intro-card :deep(.el-card__body) {
  padding: 18px 22px;
}

.intro-icon {
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  margin-top: 1px;
  color: #fff;
}

.intro-title {
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}

.intro-content p {
  margin: 8px 0 0;
  line-height: 1.8;
  color: rgb(255 255 255 / 92%);
}

.intro-card :deep(.el-tag) {
  font-weight: 600;
  color: #1d6fd9;
  background: rgb(255 255 255 / 92%);
  border-color: rgb(255 255 255 / 52%);
}

.condition-summary {
  overflow: hidden;
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9) 0%,
    var(--el-color-success-light-9) 100%
  );
  border: 1px solid var(--el-color-primary-light-8);
  border-radius: 8px;
}

.summary-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  align-items: center;
  padding: 8px 14px;
  font-size: 13px;
}

.summary-head {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding-right: 4px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.summary-head-icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  color: var(--el-color-primary);
}

.summary-head-tip {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  color: var(--el-text-color-placeholder);
  cursor: help;
}

.summary-list,
.summary-item {
  display: inline-flex;
  align-items: center;
}

.summary-list {
  flex: 1;
  flex-wrap: wrap;
  gap: 4px 12px;
  min-width: 0;
}

.summary-item {
  gap: 6px;
  line-height: 1.2;
  white-space: nowrap;
}

.summary-label {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}

.summary-value {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.summary-value--neutral {
  color: var(--el-text-color-primary);
}

.summary-value--success {
  color: var(--el-color-success);
}

.summary-value--muted {
  font-weight: 500;
  color: var(--el-text-color-placeholder);
}

.summary-separator {
  display: inline-block;
  width: 1px;
  height: 14px;
  background: var(--el-border-color);
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
}
</style>
