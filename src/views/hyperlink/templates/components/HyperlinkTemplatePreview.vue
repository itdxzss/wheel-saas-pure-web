<script setup lang="ts">
import { computed } from "vue";
import { ChatDotRound, Link } from "@element-plus/icons-vue";
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
    return "example.com";
  }
});
const buttonLabel = computed(
  () => props.form.button.displayText.trim() || "立即查看"
);
</script>

<template>
  <aside class="preview-pane">
    <div class="preview-pane-header">
      <el-icon class="preview-icon"><ChatDotRound /></el-icon>
      <strong>WhatsApp 实时预览</strong>
      <el-tag type="primary" effect="light" round>{{ typeLabel }}</el-tag>
    </div>

    <div class="phone-shell">
      <div class="phone-screen">
        <div class="phone-status">
          <strong>11:46</strong>
          <span class="phone-notch" />
          <span class="phone-signals">▲ ◉ ▮</span>
        </div>

        <div class="wa-topbar">
          <span class="wa-back">‹</span>
          <el-avatar class="wa-avatar" :size="34">商</el-avatar>
          <div class="wa-contact">
            <div class="wa-name">WhatsApp</div>
            <div class="wa-online">在线</div>
          </div>
          <span class="wa-action">▰</span>
          <span class="wa-action">⌕</span>
        </div>

        <div class="wa-chat">
          <div class="wa-date">今天</div>

          <template v-if="form.messageType === 1">
            <div class="wa-message-bubble">
              <div class="link-card">
                <div v-loading="imageLoading" class="wa-image-box">
                  <el-image
                    v-if="form.imageUrl"
                    :src="form.imageUrl"
                    fit="cover"
                    class="wa-image"
                  />
                  <div v-else class="wa-image-placeholder">
                    <span>链接预览图</span>
                  </div>
                </div>
                <div class="link-copy">
                  <strong>{{ form.title || "消息标题" }}</strong>
                  <span>{{ form.linkDescription || "链接描述" }}</span>
                  <small>{{ linkHost }}</small>
                </div>
              </div>
              <div class="message-copy">{{ form.content || "消息正文" }}</div>
              <div class="message-meta">
                <span>未命名模板</span><span>11:46 ✓✓</span>
              </div>
            </div>
          </template>

          <template v-else-if="form.messageType === 3">
            <div class="wa-message-bubble button-message">
              <div
                v-if="form.imageUrl || imageLoading"
                v-loading="imageLoading"
                class="wa-image-box optional-image"
              >
                <el-image
                  v-if="form.imageUrl"
                  :src="form.imageUrl"
                  fit="cover"
                  class="wa-image"
                />
              </div>
              <strong class="message-title">{{ form.title || "标题" }}</strong>
              <div v-if="form.content" class="message-copy">
                {{ form.content }}
              </div>
              <div class="message-meta message-meta--right">
                <span>11:46 ✓✓</span>
              </div>
              <button type="button" class="preview-button">
                <el-icon><Link /></el-icon>
                {{ buttonLabel }}
              </button>
            </div>
          </template>

          <template v-else>
            <div class="wa-message-bubble card-lead">
              <strong class="message-title">{{ form.title || "标题" }}</strong>
              <div v-if="form.content" class="message-copy">
                {{ form.content }}
              </div>
              <div class="message-meta message-meta--right">
                <span>11:46 ✓✓</span>
              </div>
            </div>
            <div class="wa-message-bubble card-message">
              <div
                v-if="form.imageUrl || imageLoading"
                v-loading="imageLoading"
                class="wa-image-box optional-image"
              >
                <el-image
                  v-if="form.imageUrl"
                  :src="form.imageUrl"
                  fit="cover"
                  class="wa-image"
                />
              </div>
              <div class="card-text">
                {{ form.cardText || "点击下方按钮查看详情" }}
              </div>
              <div class="message-meta message-meta--right">
                <span>11:46 ✓✓</span>
              </div>
              <button type="button" class="preview-button">
                <el-icon><Link /></el-icon>
                {{ buttonLabel }}
              </button>
            </div>
          </template>
        </div>

        <div class="wa-composer">
          <span>☺</span>
          <span class="composer-input">输入消息</span>
          <span>⌕</span>
          <span class="composer-mic">●</span>
        </div>
        <div class="phone-home-indicator" />
      </div>
    </div>

    <div class="preview-tip">模板仅保存消息内容，不包含账号范围或数据包。</div>
  </aside>
</template>

<style scoped>
.preview-pane {
  position: sticky;
  top: 0;
  display: flex;
  flex: 0 0 360px;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  width: 360px;
  padding: 14px 14px 16px;
  background:
    radial-gradient(
      circle at 50% 0%,
      var(--el-color-primary-light-8),
      transparent 42%
    ),
    var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
}

.preview-pane-header {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  color: var(--el-text-color-primary);
}

.preview-pane-header strong {
  flex: 1;
  font-size: 14px;
}

.preview-icon {
  font-size: 18px;
  color: #12a36f;
}

.phone-shell {
  width: 330px;
  padding: 8px;
  background: #111827;
  border-radius: 36px;
  box-shadow:
    0 18px 38px rgb(15 23 42 / 18%),
    inset 0 0 0 1px rgb(255 255 255 / 16%);
}

.phone-screen {
  position: relative;
  min-height: 610px;
  overflow: hidden;
  background: #efe8dc;
  border-radius: 29px;
}

.phone-status {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  height: 34px;
  padding: 0 16px;
  font-size: 11px;
  color: #fff;
  background: #0a1018;
}

.phone-notch {
  width: 78px;
  height: 21px;
  background: #020617;
  border-radius: 14px;
}

.phone-signals {
  text-align: right;
}

.wa-topbar {
  display: grid;
  grid-template-columns: 18px 34px 1fr 18px 18px;
  gap: 8px;
  align-items: center;
  min-height: 57px;
  padding: 0 11px;
  color: #fff;
  background: #0c7164;
}

.wa-back {
  font-size: 28px;
  line-height: 1;
}

.wa-avatar {
  font-weight: 700;
  color: #fff;
  background: #26bd80;
}

.wa-name {
  font-size: 14px;
  font-weight: 700;
}

.wa-online {
  font-size: 10px;
  color: rgb(255 255 255 / 78%);
}

.wa-action {
  font-size: 14px;
  text-align: center;
}

.wa-chat {
  min-height: 458px;
  padding: 12px 10px 68px;
  background:
    radial-gradient(
      circle at 18px 26px,
      rgb(42 59 72 / 9%) 2px,
      transparent 3px
    ),
    radial-gradient(
      circle at 54px 74px,
      rgb(42 59 72 / 7%) 2px,
      transparent 3px
    ),
    #efe8dc;
  background-size: 88px 96px;
}

.wa-date {
  width: fit-content;
  padding: 4px 12px;
  margin: 0 auto 12px;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  background: #e6f1ef;
  border-radius: 999px;
}

.wa-message-bubble {
  display: grid;
  gap: 7px;
  padding: 7px;
  margin-bottom: 8px;
  background: #fff;
  border-radius: 9px;
  box-shadow: 0 2px 7px rgb(15 23 42 / 12%);
}

.link-card {
  overflow: hidden;
  background: #edf2f7;
  border-radius: 7px;
}

.wa-image-box {
  min-height: 150px;
  overflow: hidden;
  background: #e5f8f2;
}

.optional-image {
  min-height: 0;
  border-radius: 7px;
}

.wa-image,
.wa-image-placeholder {
  width: 100%;
  height: 160px;
}

.wa-image-placeholder {
  display: grid;
  place-items: center;
  font-size: 12px;
  color: #78909c;
  background: linear-gradient(135deg, #eefdf7, #e5f7f4);
}

.link-copy {
  display: grid;
  gap: 2px;
  padding: 8px 9px;
}

.link-copy strong,
.message-title {
  font-size: 13px;
  color: #111827;
}

.link-copy span,
.link-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  color: #64748b;
  white-space: nowrap;
}

.link-copy small {
  color: #94a3b8;
}

.message-copy,
.card-text {
  font-size: 12px;
  line-height: 1.5;
  color: #1f2937;
  white-space: pre-wrap;
}

.card-text {
  min-height: 32px;
}

.message-meta {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: #94a3b8;
}

.message-meta--right {
  justify-content: flex-end;
}

.preview-button {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  width: calc(100% + 14px);
  padding: 9px 8px 3px;
  margin: 2px -7px -2px;
  font-size: 12px;
  color: #0b91d3;
  cursor: default;
  background: transparent;
  border: 0;
  border-top: 1px solid #eef2f7;
}

.card-lead {
  margin-bottom: 5px;
}

.wa-composer {
  position: absolute;
  right: 8px;
  bottom: 27px;
  left: 8px;
  display: grid;
  grid-template-columns: 18px 1fr 18px 25px;
  gap: 6px;
  align-items: center;
  font-size: 11px;
  color: #64748b;
}

.composer-input {
  padding: 8px 10px;
  background: #fff;
  border-radius: 18px;
}

.composer-mic {
  display: grid;
  place-items: center;
  width: 25px;
  height: 25px;
  color: #fff;
  background: #08a88a;
  border-radius: 50%;
}

.phone-home-indicator {
  position: absolute;
  bottom: 8px;
  left: 50%;
  width: 92px;
  height: 4px;
  background: #111827;
  border-radius: 999px;
  transform: translateX(-50%);
}

.preview-tip {
  width: 100%;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

@media (width <= 1100px) {
  .preview-pane {
    position: static;
    flex-basis: auto;
    width: 100%;
  }
}
</style>
