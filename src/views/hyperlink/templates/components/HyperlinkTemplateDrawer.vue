<script setup lang="ts">
import { computed } from "vue";
import { Link, MessageBox, QuestionFilled } from "@element-plus/icons-vue";
import type { HyperlinkTemplateDrawerMode } from "../composables/useHyperlinkTemplatePage";
import {
  hyperlinkMessageTypeOptions,
  type HyperlinkTemplateForm
} from "../domain/template-form";
import HyperlinkTemplatePreview from "./HyperlinkTemplatePreview.vue";
import ResourceAssetField from "../../library/components/ResourceAssetField.vue";

type ContentField =
  | "image"
  | "title"
  | "linkDescription"
  | "promotionLink"
  | "content"
  | "cardText"
  | "button";

const visible = defineModel<boolean>({ required: true });
const form = defineModel<HyperlinkTemplateForm>("form", { required: true });

const props = defineProps<{
  mode: HyperlinkTemplateDrawerMode;
  title: string;
  loading: boolean;
  detailLoading: boolean;
  imageLoading: boolean;
}>();

const emit = defineEmits<{
  (event: "save"): void;
  (event: "message-type-change"): void;
}>();

const drawerSubtitle = computed(() =>
  props.mode === "edit"
    ? "左侧 WhatsApp 真机实时预览 · 右侧修改模板内容"
    : "左侧 WhatsApp 真机实时预览 · 右侧填写模板内容"
);
const imageRequired = computed(() => form.value.messageType === 1);
const imageLabel = computed(() =>
  form.value.messageType === 1
    ? "链接预览图"
    : form.value.messageType === 4
      ? "卡片图片"
      : "正文主图"
);
const contentLabel = computed(() => {
  if (form.value.messageType === 3) return "底部小字";
  if (form.value.messageType === 4) return "副标题";
  return "正文";
});
const contentMaxLength = computed(() =>
  form.value.messageType === 1 ? 2000 : form.value.messageType === 4 ? 60 : 1024
);

function fieldOrder(field: ContentField): number {
  const order: Record<ContentField, Partial<Record<1 | 3 | 4, number>>> = {
    image: { 1: 1, 3: 1, 4: 3 },
    title: { 1: 2, 3: 2, 4: 1 },
    linkDescription: { 1: 3 },
    promotionLink: { 1: 4 },
    content: { 1: 5, 3: 3, 4: 2 },
    cardText: { 4: 4 },
    button: { 3: 4, 4: 5 }
  };
  if (form.value.messageType === 2) return 0;
  return order[field][form.value.messageType] ?? 0;
}

function onMessageTypeChange(): void {
  emit("message-type-change");
}
</script>

<template>
  <el-drawer
    v-model="visible"
    size="min(1200px, calc(100vw - 80px))"
    destroy-on-close
    class="hyperlink-template-drawer"
  >
    <template #header>
      <div class="drawer-title">
        <div class="drawer-title-icon" aria-hidden="true">
          <el-icon><MessageBox /></el-icon>
        </div>
        <div>
          <div class="drawer-title-text">{{ props.title }}</div>
          <div class="drawer-title-subtitle">{{ drawerSubtitle }}</div>
        </div>
      </div>
    </template>

    <el-skeleton v-if="detailLoading" :rows="12" animated />
    <div v-else class="template-editor">
      <HyperlinkTemplatePreview :form="form" :image-loading="imageLoading" />

      <el-form :model="form" label-position="top" class="form-pane">
        <section class="form-section">
          <header class="section-header">
            <span class="section-index">1</span>
            <div>
              <div class="section-title">基础信息</div>
              <div class="section-desc">用于搜索、筛选和引用模板</div>
            </div>
          </header>
          <div class="section-body">
            <el-form-item label="模板名称" required>
              <el-input
                v-model="form.name"
                maxlength="128"
                show-word-limit
                clearable
                placeholder="例如：菲律宾新客福利-普通按钮"
              />
            </el-form-item>
            <el-form-item label="消息类型" required>
              <el-radio-group
                v-model="form.messageType"
                class="message-type-group"
                @change="onMessageTypeChange"
              >
                <el-radio-button
                  v-for="option in hyperlinkMessageTypeOptions"
                  :key="option.value"
                  :label="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </el-radio-button>
              </el-radio-group>
            </el-form-item>
          </div>
        </section>

        <section class="form-section">
          <header class="section-header">
            <span class="section-index">2</span>
            <div>
              <div class="section-title">消息内容</div>
              <div class="section-desc">填什么左侧立即可见</div>
            </div>
          </header>
          <div class="section-body section-body--ordered">
            <el-form-item
              :label="imageLabel"
              :required="imageRequired"
              :style="{ order: fieldOrder('image') }"
            >
              <div class="asset-selector">
                <ResourceAssetField v-model="form.assetId" />
                <div class="field-tip">
                  支持从素材库选择或在选择器中批量上传 JPG，单张不超过 500KB。
                </div>
              </div>
            </el-form-item>

            <el-form-item
              label="标题"
              required
              :style="{ order: fieldOrder('title') }"
            >
              <el-input
                v-model="form.title"
                :type="form.messageType === 3 ? 'textarea' : 'text'"
                :rows="2"
                maxlength="512"
                show-word-limit
                placeholder="请输入标题"
              />
            </el-form-item>

            <el-form-item
              v-if="form.messageType === 1"
              label="链接描述"
              required
              :style="{ order: fieldOrder('linkDescription') }"
            >
              <el-input
                v-model="form.linkDescription"
                maxlength="512"
                show-word-limit
                placeholder="请输入链接卡片描述"
              />
            </el-form-item>

            <el-form-item
              v-if="form.messageType === 1"
              label="推广链接"
              :style="{ order: fieldOrder('promotionLink') }"
            >
              <el-input
                v-model="form.promotionLink"
                maxlength="2048"
                placeholder="https://example.com/promo"
              />
            </el-form-item>

            <el-form-item
              :label="contentLabel"
              :required="form.messageType === 1"
              :style="{ order: fieldOrder('content') }"
            >
              <el-input
                v-model="form.content"
                type="textarea"
                :rows="form.messageType === 1 ? 4 : 3"
                :maxlength="contentMaxLength"
                show-word-limit
                :placeholder="
                  form.messageType === 1
                    ? '请输入消息正文'
                    : `请输入${contentLabel}`
                "
              />
            </el-form-item>

            <el-form-item
              v-if="form.messageType === 4"
              label="卡片正文"
              required
              :style="{ order: fieldOrder('cardText') }"
            >
              <el-input
                v-model="form.cardText"
                type="textarea"
                :rows="3"
                maxlength="500"
                show-word-limit
                placeholder="显示在卡片图片下方的正文"
              />
            </el-form-item>

            <el-form-item
              v-if="form.messageType === 3 || form.messageType === 4"
              label="按钮配置"
              required
              :style="{ order: fieldOrder('button') }"
            >
              <div class="button-config">
                <div class="button-config-tip">
                  模板保存按钮类型、文字和默认跳转链接，创建任务时仍可调整链接。
                </div>
                <div class="button-card">
                  <div class="button-card-header">
                    <div class="button-card-type">
                      <el-icon><Link /></el-icon>
                      <el-tag type="success" effect="light" round>
                        链接跳转
                      </el-tag>
                    </div>
                    <span>仅支持 1 个 URL 按钮</span>
                  </div>
                  <div class="button-fields">
                    <label>
                      <span>按钮文字</span>
                      <el-input
                        v-model="form.button.displayText"
                        maxlength="20"
                        show-word-limit
                        placeholder="例如：立即查看"
                      />
                    </label>
                    <label>
                      <span>跳转链接</span>
                      <el-input
                        v-model="form.button.targetValue"
                        maxlength="2048"
                        placeholder="https://example.com/promo"
                      />
                    </label>
                  </div>
                  <div
                    class="tracking-setting"
                    :class="{ 'is-enabled': form.button.useShortLink }"
                  >
                    <div class="tracking-heading">
                      <span>深度追踪</span>
                      <el-tooltip
                        content="开启后任务执行会把跳转链接转换为可追踪短链，用于记录访问设备、地区和点击次数。"
                        placement="top"
                      >
                        <el-icon class="tracking-help"
                          ><QuestionFilled
                        /></el-icon>
                      </el-tooltip>
                    </div>
                    <el-switch v-model="form.button.useShortLink" />
                  </div>
                  <div class="tracking-warning">
                    非 BC 业务请勿开启；错误使用可能造成域名或账号被风控。
                  </div>
                </div>
              </div>
            </el-form-item>
          </div>
        </section>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button
        type="primary"
        :loading="loading"
        :disabled="detailLoading"
        @click="emit('save')"
      >
        保存模板
      </el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
.drawer-title {
  display: flex;
  gap: 12px;
  align-items: center;
}

.drawer-title-icon {
  display: grid;
  flex: 0 0 38px;
  place-items: center;
  width: 38px;
  height: 38px;
  color: #fff;
  background: linear-gradient(135deg, #409eff, #2563eb);
  border-radius: 10px;
  box-shadow: 0 5px 14px rgb(64 158 255 / 28%);
}

.drawer-title-icon .el-icon {
  font-size: 22px;
}

.drawer-title-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.drawer-title-subtitle {
  margin-top: 3px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.template-editor {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.form-pane {
  flex: 1;
  min-width: 0;
  padding: 4px 0 8px;
}

.form-section {
  margin-bottom: 18px;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.form-section:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 4px 16px -10px rgb(64 158 255 / 35%);
}

.section-header {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(
    180deg,
    var(--el-color-primary-light-9),
    transparent
  );
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.section-index {
  display: grid;
  flex: 0 0 26px;
  place-items: center;
  width: 26px;
  height: 26px;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #409eff, #2563eb);
  border-radius: 8px;
  box-shadow: 0 3px 8px -3px rgb(64 158 255 / 65%);
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.section-desc {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.section-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
}

.section-body :deep(.el-form-item) {
  width: 100%;
  margin-bottom: 0;
}

.section-body--ordered :deep(.el-form-item) {
  order: 0;
}

.message-type-group {
  display: inline-flex;
  width: fit-content;
  max-width: 100%;
}

.message-type-group :deep(.el-radio-button) {
  flex: 0 0 auto;
}

.message-type-group :deep(.el-radio-button__inner) {
  min-width: 104px;
  padding-right: 18px;
  padding-left: 18px;
}

.asset-selector,
.button-config {
  width: 100%;
}

.field-tip,
.button-config-tip {
  margin-top: 7px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.button-card {
  padding: 12px;
  margin-top: 8px;
  background: var(--el-fill-color-extra-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
}

.button-card-header,
.button-card-type,
.tracking-setting,
.tracking-heading {
  display: flex;
  align-items: center;
}

.button-card-header {
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.button-card-type,
.tracking-heading {
  gap: 7px;
}

.button-card-type .el-icon {
  color: var(--el-color-primary);
}

.button-fields {
  display: grid;
  grid-template-columns: minmax(140px, 0.72fr) minmax(220px, 1.28fr);
  gap: 10px;
}

.button-fields label {
  display: grid;
  gap: 6px;
  min-width: 0;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.tracking-setting {
  justify-content: space-between;
  padding: 9px 10px;
  margin-top: 10px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.tracking-setting.is-enabled {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

.tracking-heading {
  font-size: 13px;
  font-weight: 600;
}

.tracking-help {
  color: var(--el-text-color-secondary);
  cursor: help;
}

.tracking-warning {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--el-color-warning-dark-2);
}

@media (width <= 1100px) {
  .template-editor {
    flex-direction: column;
  }
}

@media (width <= 720px) {
  .message-type-group {
    display: flex;
    width: 100%;
  }

  .message-type-group :deep(.el-radio-button) {
    flex: 1 1 0;
  }

  .message-type-group :deep(.el-radio-button__inner) {
    width: 100%;
    min-width: 0;
    padding-right: 10px;
    padding-left: 10px;
  }

  .button-fields {
    grid-template-columns: 1fr;
  }
}
</style>
