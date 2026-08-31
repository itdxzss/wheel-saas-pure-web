<script setup lang="ts">
import { computed } from "vue";
import { MESSAGE_TYPE_LINK } from "../domain/task-form";

const props = defineProps<{
  messageType: number;
  title: string;
  linkDescription: string;
  promotionLink: string;
  content: string;
  /** 已上传图片的可访问地址；未选图时为空 */
  imageUrl: string;
}>();

const isLink = computed(() => props.messageType === MESSAGE_TYPE_LINK);
</script>

<template>
  <div class="preview-pane">
    <div class="preview-header">
      <span class="preview-title">WhatsApp 效果预览</span>
      <el-tag type="success" effect="plain" size="small" round>实时</el-tag>
    </div>

    <div class="chat-window">
      <div class="bubble">
        <!-- 链接消息：预览图 + 加粗标题 + 描述 + 链接，正文在卡片下方 -->
        <div v-if="isLink" class="link-card">
          <div v-if="imageUrl" class="link-image">
            <img :src="imageUrl" alt="链接预览图" />
          </div>
          <div class="link-body">
            <div class="link-title">{{ title || "消息标题" }}</div>
            <div class="link-desc">{{ linkDescription || "链接描述" }}</div>
            <div class="link-url">
              {{ promotionLink || "https://example.com" }}
            </div>
          </div>
        </div>
        <!-- 图文消息：配图可选，不传则只发文字 -->
        <div v-else-if="imageUrl" class="image-block">
          <img :src="imageUrl" alt="图文配图" />
        </div>

        <div class="bubble-text">
          {{ content || "在右侧编辑内容，这里实时预览" }}
        </div>
        <div class="bubble-meta">
          <span class="bubble-time">12:00</span>
          <span class="bubble-ticks">✓✓</span>
        </div>
      </div>
    </div>

    <p class="preview-tip">预览仅示意排版，真机渲染以 WhatsApp 客户端为准。</p>
  </div>
</template>

<style scoped>
.preview-pane {
  width: 340px;
  padding: 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.preview-header {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
}

.preview-title {
  font-size: 14px;
  font-weight: 600;
}

.chat-window {
  padding: 16px 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.bubble {
  max-width: 100%;
  padding: 6px 8px;
  background: var(--el-color-white);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 12%);
}

.link-card {
  overflow: hidden;
  background: var(--el-fill-color);
  border-radius: 6px;
}

.link-image img,
.image-block img {
  display: block;
  width: 100%;
  border-radius: 6px;
}

.link-body {
  padding: 8px;
}

.link-title {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.3;
}

.link-desc {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.link-url {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-color-primary);
  word-break: break-all;
}

.bubble-text {
  margin-top: 6px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
}

.bubble-meta {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.preview-tip {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  text-align: center;
}
</style>
