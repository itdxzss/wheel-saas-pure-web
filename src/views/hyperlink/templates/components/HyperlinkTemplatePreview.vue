<script setup lang="ts">
import { computed } from "vue";
import {
  hyperlinkMessageTypeLabel,
  type HyperlinkTemplateForm
} from "../domain/template-form";

const props = defineProps<{
  form: HyperlinkTemplateForm;
  imageLoading: boolean;
}>();

const typeLabel = computed(() =>
  hyperlinkMessageTypeLabel(props.form.messageType)
);
const linkHost = computed(() => {
  try {
    return new URL(props.form.promotionLink).hostname;
  } catch {
    return "推广链接";
  }
});
</script>

<template>
  <el-card shadow="never" class="template-preview">
    <template #header>
      <div class="preview-header">
        <span>WhatsApp 接收效果</span>
        <el-tag effect="plain">{{ typeLabel }}</el-tag>
      </div>
    </template>

    <div class="phone-shell">
      <div class="phone-screen">
        <div class="phone-topbar">
          <span class="back">‹</span>
          <el-avatar :size="38" class="avatar">商</el-avatar>
          <div>
            <div class="contact-name">Business Account</div>
            <div class="online">online</div>
          </div>
          <span class="menu">⋮</span>
        </div>

        <div class="chat-area">
          <div class="date-chip">今天</div>
          <div class="message-bubble">
            <template v-if="form.messageType === 1">
              <div class="link-card">
                <div v-loading="imageLoading" class="image-box">
                  <el-image
                    v-if="form.imageUrl"
                    :src="form.imageUrl"
                    fit="cover"
                    class="message-image"
                  />
                  <div v-else class="image-placeholder">链接预览图</div>
                </div>
                <div class="link-title">{{ form.title || "消息标题" }}</div>
                <div class="link-description">
                  {{ form.linkDescription || "链接描述" }}
                </div>
                <div class="link-host">{{ linkHost }}</div>
              </div>
              <div class="message-content">
                {{ form.content || "消息正文" }}
              </div>
            </template>

            <template v-else>
              <div
                v-if="form.imageUrl || imageLoading"
                v-loading="imageLoading"
                class="image-box"
              >
                <el-image
                  v-if="form.imageUrl"
                  :src="form.imageUrl"
                  fit="cover"
                  class="message-image"
                />
              </div>
              <div class="button-title">{{ form.title || "消息标题" }}</div>
              <div v-if="form.content" class="message-content">
                {{ form.content }}
              </div>
              <div v-if="form.messageType === 4" class="card-text">
                {{ form.cardText || "卡片底部文字" }}
              </div>
              <el-button plain type="primary" class="cta-button">
                {{ form.button.displayText || "URL 按钮" }}
              </el-button>
            </template>

            <div class="message-meta">
              <span>{{ form.name || "未命名模板" }}</span>
              <span>18:25 ✓✓</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.template-preview {
  border-radius: 4px;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.phone-shell {
  max-width: 330px;
  padding: 10px;
  margin: 0 auto;
  background: #111827;
  border-radius: 32px;
  box-shadow: 0 14px 34px rgb(15 23 42 / 16%);
}

.phone-screen {
  min-height: 525px;
  overflow: hidden;
  background: #efe7d8;
  border-radius: 24px;
}

.phone-topbar {
  display: grid;
  grid-template-columns: 22px 38px 1fr 18px;
  gap: 8px;
  align-items: center;
  min-height: 62px;
  padding: 0 12px;
  color: #fff;
  background: #0f6f5c;
}

.back {
  font-size: 26px;
}

.avatar {
  color: #fff;
  background: #43bd84;
}

.contact-name {
  font-size: 14px;
  font-weight: 700;
}

.online,
.message-meta,
.link-host {
  font-size: 10px;
}

.online {
  color: rgb(255 255 255 / 75%);
}

.menu {
  font-size: 20px;
}

.chat-area {
  min-height: 463px;
  padding: 14px 11px;
  background:
    radial-gradient(
      circle at 18px 26px,
      rgb(42 59 72 / 8%) 2px,
      transparent 3px
    ),
    #efe7d8;
  background-size: 88px 96px;
}

.date-chip {
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
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgb(15 23 42 / 12%);
}

.link-card {
  overflow: hidden;
  background: #f1f5f9;
  border-radius: 7px;
}

.image-box {
  min-height: 145px;
  background: #e8fff5;
}

.message-image,
.image-placeholder {
  width: 100%;
  height: 155px;
}

.image-placeholder {
  display: grid;
  place-content: center;
  font-size: 12px;
  color: #78909c;
  background: linear-gradient(135deg, #eefdf7, #e5f7f4);
}

.link-title,
.link-description,
.link-host {
  padding: 0 9px;
}

.link-title,
.button-title {
  font-weight: 700;
  color: #111827;
}

.link-title {
  padding-top: 8px;
}

.link-description {
  font-size: 12px;
  color: #64748b;
}

.link-host {
  padding-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #94a3b8;
  white-space: nowrap;
}

.message-content,
.card-text {
  font-size: 13px;
  line-height: 1.5;
  color: #111827;
  white-space: pre-wrap;
}

.card-text {
  font-size: 11px;
  color: #64748b;
}

.cta-button {
  width: 100%;
  margin-top: 2px;
}

.message-meta {
  display: flex;
  justify-content: space-between;
  color: #94a3b8;
}
</style>
