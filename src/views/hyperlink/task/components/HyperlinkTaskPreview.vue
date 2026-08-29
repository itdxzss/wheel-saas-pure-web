<script setup lang="ts">
import { computed } from "vue";
import type { HyperlinkTaskForm } from "../domain/editor-rules";
import HyperlinkProtectedAssetImage from "./HyperlinkProtectedAssetImage.vue";

const props = defineProps<{ form: HyperlinkTaskForm }>();

const typeLabel = computed(() => {
  const labels = { 1: "单图文", 2: "双图文", 3: "普通按钮", 4: "卡片按钮" };
  return labels[props.form.messageType];
});
const imageId = computed(() =>
  props.form.messageType === 1
    ? props.form.messageContent.linkPreviewAssetId
    : props.form.messageContent.bodyMainAssetId
);
const linkHost = computed(() => {
  try {
    return new URL(props.form.messageContent.promotionLink ?? "").hostname;
  } catch {
    return "推广链接";
  }
});
</script>

<template>
  <el-card shadow="never" class="preview-card">
    <template #header>
      <div class="preview-header">
        <span>WhatsApp 实时预览</span>
        <el-tag effect="plain" size="small">{{ typeLabel }}</el-tag>
      </div>
    </template>
    <div class="phone-shell">
      <div class="phone-screen">
        <div class="phone-bar">
          <span class="back">‹</span>
          <el-avatar :size="38">商</el-avatar>
          <div><b>Business Account</b><small>online</small></div>
          <span>⋮</span>
        </div>
        <div class="chat-area">
          <div class="day-chip">今天</div>
          <div class="message-bubble">
            <template v-if="form.messageType === 1 || form.messageType === 2">
              <div class="link-card">
                <HyperlinkProtectedAssetImage
                  v-if="form.messageContent.linkPreviewAssetId"
                  :asset-id="form.messageContent.linkPreviewAssetId"
                  class="message-image"
                />
                <div v-else class="image-placeholder">链接预览图</div>
                <b>{{ form.messageContent.title || "消息标题" }}</b>
                <span>{{
                  form.messageContent.linkDescription || "链接描述"
                }}</span>
                <small>{{ linkHost }}</small>
              </div>
              <HyperlinkProtectedAssetImage
                v-if="
                  form.messageType === 2 && form.messageContent.bodyMainAssetId
                "
                :asset-id="form.messageContent.bodyMainAssetId"
                class="message-image second-image"
              />
              <div class="message-text">
                {{ form.messageContent.content || "消息正文" }}
              </div>
            </template>
            <template v-else>
              <HyperlinkProtectedAssetImage
                v-if="imageId"
                :asset-id="imageId"
                class="message-image"
              />
              <b>{{ form.messageContent.title || "消息标题" }}</b>
              <div v-if="form.messageType === 4" class="message-text">
                {{ form.messageContent.cardText || "卡片正文" }}
              </div>
              <small v-if="form.messageContent.content">
                {{ form.messageContent.content }}
              </small>
              <el-button
                v-if="form.messageContent.buttons[0]"
                plain
                type="primary"
                class="preview-button"
              >
                {{ form.messageContent.buttons[0].displayText || "URL 按钮" }}
              </el-button>
            </template>
            <div class="meta"><span>18:25</span><span>✓✓</span></div>
          </div>
        </div>
      </div>
    </div>
    <div class="preview-tip">最终展示效果以接收方 WhatsApp 客户端为准</div>
  </el-card>
</template>

<style scoped>
.preview-card {
  position: sticky;
  top: 0;
}

.preview-header,
.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.phone-shell {
  max-width: 330px;
  padding: 10px;
  margin: auto;
  background: #111827;
  border-radius: 30px;
}

.phone-screen {
  min-height: 530px;
  overflow: hidden;
  background: #efe7d8;
  border-radius: 22px;
}

.phone-bar {
  display: grid;
  grid-template-columns: 22px 38px 1fr 18px;
  gap: 8px;
  align-items: center;
  min-height: 64px;
  padding: 0 12px;
  color: #fff;
  background: #0f6f5c;
}

.phone-bar div,
.link-card {
  display: grid;
}

.phone-bar small {
  color: rgb(255 255 255 / 75%);
}

.back {
  font-size: 24px;
}

.chat-area {
  min-height: 466px;
  padding: 14px 11px;
}

.day-chip {
  width: fit-content;
  padding: 4px 12px;
  margin: 0 auto 12px;
  font-size: 11px;
  color: #64748b;
  background: #e8f2ef;
  border-radius: 999px;
}

.message-bubble {
  display: grid;
  gap: 7px;
  padding: 7px;
  color: #111827;
  background: #fff;
  border-radius: 8px;
}

.link-card {
  gap: 4px;
  overflow: hidden;
  background: #f1f5f9;
  border-radius: 7px;
}

.link-card b,
.link-card span,
.link-card small {
  padding: 0 9px;
}

.link-card small {
  padding-bottom: 8px;
  color: #94a3b8;
}

.message-image,
.image-placeholder {
  width: 100%;
  height: 155px;
}

.image-placeholder {
  display: grid;
  place-content: center;
  color: #78909c;
  background: #e8fff5;
}

.second-image {
  height: 120px;
}

.message-text {
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.preview-button {
  width: 100%;
}

.meta,
.message-bubble small,
.preview-tip {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.preview-tip {
  margin-top: 12px;
  text-align: center;
}
</style>
