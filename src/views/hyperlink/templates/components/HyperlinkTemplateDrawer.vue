<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { UploadFile, UploadUserFile } from "element-plus";
import type { HyperlinkTemplateDrawerMode } from "../composables/useHyperlinkTemplatePage";
import {
  hyperlinkMessageTypeOptions,
  type HyperlinkTemplateForm
} from "../domain/template-form";
import HyperlinkTemplatePreview from "./HyperlinkTemplatePreview.vue";

const visible = defineModel<boolean>({ required: true });
const form = defineModel<HyperlinkTemplateForm>("form", { required: true });

const props = defineProps<{
  mode: HyperlinkTemplateDrawerMode;
  title: string;
  loading: boolean;
  detailLoading: boolean;
  imageLoading: boolean;
  onImageSelect: (file: File) => Promise<boolean>;
}>();

const emit = defineEmits<{
  (event: "save"): void;
  (event: "clear-image"): void;
  (event: "message-type-change"): void;
}>();

const fileList = ref<UploadUserFile[]>([]);
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

async function onImageChange(file: UploadFile): Promise<void> {
  if (!file.raw) return;
  const accepted = await props.onImageSelect(file.raw);
  fileList.value = accepted ? [file] : [];
}

function clearImage(): void {
  fileList.value = [];
  emit("clear-image");
}

function onMessageTypeChange(): void {
  fileList.value = [];
  emit("message-type-change");
}

watch(visible, opened => {
  if (!opened) fileList.value = [];
});
</script>

<template>
  <el-drawer v-model="visible" :title="title" size="1160px" destroy-on-close>
    <el-skeleton v-if="detailLoading" :rows="12" animated />
    <div v-else class="drawer-content">
      <HyperlinkTemplatePreview :form="form" :image-loading="imageLoading" />

      <el-form :model="form" label-position="top" class="template-form">
        <el-alert
          title="支持单图文、普通按钮和卡片按钮；CTA 仅支持 1 个 URL 按钮。"
          type="info"
          show-icon
          :closable="false"
        />

        <el-card shadow="never">
          <template #header><span class="card-title">基础信息</span></template>
          <el-form-item label="模板名称" required>
            <el-input
              v-model="form.name"
              maxlength="128"
              show-word-limit
              placeholder="请输入模板名称"
            />
          </el-form-item>
          <el-form-item label="消息类型" required>
            <el-select
              v-model="form.messageType"
              class="full-width"
              @change="onMessageTypeChange"
            >
              <el-option
                v-for="option in hyperlinkMessageTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
        </el-card>

        <el-card shadow="never">
          <template #header><span class="card-title">消息内容</span></template>
          <el-form-item label="标题" required>
            <el-input
              v-model="form.title"
              maxlength="512"
              show-word-limit
              placeholder="请输入消息标题"
            />
          </el-form-item>
          <el-form-item
            :label="contentLabel"
            :required="form.messageType === 1"
          >
            <el-input
              v-model="form.content"
              type="textarea"
              :rows="4"
              :maxlength="2000"
              show-word-limit
              :placeholder="
                form.messageType === 1
                  ? '请输入消息正文'
                  : `请输入${contentLabel}`
              "
            />
          </el-form-item>

          <template v-if="form.messageType === 1">
            <el-form-item label="链接描述" required>
              <el-input
                v-model="form.linkDescription"
                maxlength="512"
                show-word-limit
                placeholder="请输入链接卡片描述"
              />
            </el-form-item>
            <el-form-item label="推广链接" required>
              <el-input
                v-model="form.promotionLink"
                maxlength="2048"
                placeholder="https://example.com/promo"
              />
            </el-form-item>
          </template>

          <el-form-item :label="imageLabel" :required="imageRequired">
            <el-upload
              v-model:file-list="fileList"
              class="full-width"
              drag
              accept=".jpg,.jpeg,image/jpeg"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="onImageChange"
            >
              <div>{{ form.imageName || "选择 JPG/JPEG 图片" }}</div>
              <template #tip>
                <div class="el-upload__tip">
                  仅支持 JPEG，且不能超过 500KB。
                </div>
              </template>
            </el-upload>
            <el-card v-if="form.imageUrl" shadow="never" class="image-card">
              <el-image
                :src="form.imageUrl"
                fit="cover"
                class="image-preview"
              />
              <div class="image-meta">
                <span>{{ form.imageName }}</span>
                <el-button link type="danger" @click="clearImage">
                  移除图片
                </el-button>
              </div>
            </el-card>
          </el-form-item>

          <template v-if="form.messageType === 3 || form.messageType === 4">
            <el-divider content-position="left">CTA URL 按钮</el-divider>
            <el-form-item label="按钮文字" required>
              <el-input
                v-model="form.button.displayText"
                maxlength="20"
                show-word-limit
                placeholder="例如：立即查看"
              />
            </el-form-item>
            <el-form-item label="跳转链接" required>
              <el-input
                v-model="form.button.targetValue"
                maxlength="2048"
                placeholder="https://example.com/promo"
              />
            </el-form-item>
            <el-form-item label="默认使用短链">
              <el-switch v-model="form.button.useShortLink" />
              <span class="field-tip"
                >仅保存模板意图，不在模板阶段生成短码。</span
              >
            </el-form-item>
          </template>

          <el-form-item v-if="form.messageType === 4" label="卡片正文" required>
            <el-input
              v-model="form.cardText"
              maxlength="500"
              show-word-limit
              placeholder="显示在卡片图片下方的正文"
            />
          </el-form-item>
        </el-card>
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
        保存
      </el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
.drawer-content {
  display: grid;
  grid-template-columns: minmax(330px, 0.72fr) minmax(560px, 1.28fr);
  gap: 16px;
  align-items: start;
}

.template-form {
  display: grid;
  gap: 16px;
}

.card-title {
  font-weight: 600;
}

.full-width,
:deep(.el-upload),
:deep(.el-upload-dragger) {
  width: 100%;
}

.image-card {
  width: 100%;
  margin-top: 10px;
}

.image-preview {
  width: 100%;
  height: 180px;
  border-radius: 4px;
}

.image-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.field-tip {
  margin-left: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media (width <= 980px) {
  .drawer-content {
    grid-template-columns: 1fr;
  }
}
</style>
