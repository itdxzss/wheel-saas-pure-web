<script setup lang="ts">
import { computed } from "vue";
import type { HyperlinkTemplateOption } from "@/api/hyperlink-template";
import type { HyperlinkTaskForm } from "../domain/editor-rules";
import HyperlinkAssetPicker from "./HyperlinkAssetPicker.vue";
import HyperlinkButtonEditor from "./HyperlinkButtonEditor.vue";

const form = defineModel<HyperlinkTaskForm>({ required: true });
const props = defineProps<{
  disabled: boolean;
  allowReferences: boolean;
  templates: HyperlinkTemplateOption[];
  templateLoading: boolean;
  templateHasMore: boolean;
  templateError?: string;
}>();
const emit = defineEmits<{
  (event: "use-template", id: number | null): void;
  (event: "retry-templates"): void;
  (event: "search-templates", keyword: string): void;
  (event: "load-more-templates"): void;
}>();

const templateId = defineModel<number | null>("templateId", {
  default: null
});
const isLinkCard = computed(
  () => form.value.messageType === 1 || form.value.messageType === 2
);
const hasBodyImage = computed(() => form.value.messageType !== 1);
const contentLabel = computed(() => {
  if (form.value.messageType === 3) return "底部小字";
  if (form.value.messageType === 4) return "副标题小字";
  return "正文";
});
const contentMaxLength = computed(() =>
  isLinkCard.value ? 2000 : form.value.messageType === 4 ? 60 : 200
);

function handleTemplateChange(value: unknown): void {
  emit("use-template", typeof value === "number" ? value : null);
}
</script>

<template>
  <el-card shadow="never" class="section-card">
    <template #header>
      <div class="section-header">
        <div>
          <b><span class="section-index">2</span> 消息内容</b>
          <small>按消息类型填写内容，左侧实时预览</small>
        </div>
        <div v-if="allowReferences" class="reference-tools">
          <el-select
            v-model="templateId"
            filterable
            remote
            clearable
            :remote-method="keyword => emit('search-templates', keyword)"
            :loading="templateLoading"
            placeholder="搜索并引用模板..."
            class="reference-select"
            @change="handleTemplateChange"
          >
            <el-option
              v-for="template in templates"
              :key="template.id"
              :label="`${template.name} · 类型 ${template.messageType}`"
              :value="template.id"
            />
          </el-select>
          <el-button
            v-if="templateHasMore"
            link
            type="primary"
            :loading="templateLoading"
            @click="emit('load-more-templates')"
          >
            加载更多
          </el-button>
        </div>
      </div>
    </template>

    <el-alert
      v-if="templateError && allowReferences"
      type="error"
      :closable="false"
      :title="templateError"
    >
      <el-button link type="primary" @click="emit('retry-templates')">
        重试
      </el-button>
    </el-alert>

    <el-form-item v-if="isLinkCard" label="链接预览图">
      <HyperlinkAssetPicker
        v-model="form.messageContent.linkPreviewAssetId"
        label="链接预览图"
        :disabled="disabled"
      />
    </el-form-item>
    <el-form-item label="消息标题" required>
      <el-input
        v-model="form.messageContent.title"
        :type="form.messageType === 3 ? 'textarea' : 'text'"
        :rows="3"
        maxlength="1024"
        show-word-limit
        :disabled="disabled"
        placeholder="请输入消息标题"
      />
    </el-form-item>
    <template v-if="isLinkCard">
      <el-form-item label="链接描述" required>
        <el-input
          v-model="form.messageContent.linkDescription"
          maxlength="512"
          show-word-limit
          :disabled="disabled"
          placeholder="请输入链接描述"
        />
      </el-form-item>
      <el-form-item label="推广链接" required>
        <el-input
          v-model="form.messageContent.promotionLink"
          maxlength="2048"
          :disabled="disabled"
          placeholder="https://example.com/promo"
        />
      </el-form-item>
    </template>
    <el-form-item v-if="hasBodyImage" label="正文主图">
      <HyperlinkAssetPicker
        v-model="form.messageContent.bodyMainAssetId"
        label="正文主图"
        :disabled="disabled"
      />
    </el-form-item>
    <el-form-item :label="contentLabel" :required="isLinkCard">
      <el-input
        v-model="form.messageContent.content"
        type="textarea"
        :rows="4"
        :maxlength="contentMaxLength"
        show-word-limit
        :disabled="disabled"
        :placeholder="`请输入${contentLabel}`"
      />
    </el-form-item>
    <el-form-item v-if="form.messageType === 4" label="卡片正文" required>
      <el-input
        v-model="form.messageContent.cardText"
        type="textarea"
        :rows="4"
        maxlength="500"
        show-word-limit
        :disabled="disabled"
        placeholder="请输入卡片正文"
      />
    </el-form-item>
    <el-form-item
      v-if="form.messageType === 3 || form.messageType === 4"
      label="消息按钮"
      required
    >
      <HyperlinkButtonEditor
        v-model="form.messageContent.buttons"
        :disabled="disabled"
      />
    </el-form-item>
  </el-card>
</template>

<style scoped>
.section-card {
  margin-bottom: 16px;
}

.section-header,
.section-header > div {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.section-header > div {
  justify-content: flex-start;
}

.section-header small {
  color: var(--el-text-color-secondary);
}

.section-index {
  display: inline-grid;
  place-content: center;
  width: 24px;
  height: 24px;
  margin-right: 6px;
  color: #fff;
  background: var(--el-color-primary);
  border-radius: 50%;
}

.reference-select {
  width: 230px;
}

.reference-tools {
  display: flex;
  gap: 8px;
  align-items: center;
}

:deep(.el-form-item__content),
:deep(.asset-picker),
:deep(.button-editor) {
  width: 100%;
}
</style>
