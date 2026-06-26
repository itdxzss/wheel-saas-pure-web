<script setup lang="ts">
import { computed } from "vue";
import type { MarketingTemplateForm } from "../composables/useMarketingTemplatePage";

const props = defineProps<{
  form: MarketingTemplateForm;
}>();

const previewType = computed(() =>
  props.form.linkMode === "BUTTON" ? "按钮超链" : "普通超链"
);

const bottomText = computed(() =>
  props.form.linkMode === "BUTTON"
    ? "营销模板消息 · 按钮超链"
    : "营销模板消息 · 普通链接"
);

const linkDomain = computed(() => {
  if (!props.form.promotionLink) return "";
  try {
    return new URL(props.form.promotionLink).hostname;
  } catch {
    return props.form.promotionLink.replace(/^https?:\/\//, "").split("/")[0];
  }
});
</script>

<template>
  <el-card shadow="never" class="marketing-template-preview">
    <template #header>
      <div class="preview-header">
        <span>WhatsApp 接收效果</span>
        <el-tag effect="plain">{{ previewType }}</el-tag>
      </div>
    </template>

    <div class="phone-shell">
      <div class="phone-screen">
        <div class="phone-status">
          <span>18:25</span>
          <span class="phone-notch" />
          <span>▮▮▮ 5G 🔋</span>
        </div>

        <div class="wa-topbar">
          <span class="wa-back">‹</span>
          <el-avatar class="wa-avatar" :size="40">商</el-avatar>
          <div class="wa-contact">
            <div class="wa-name">Business Account</div>
            <div class="wa-online">online</div>
          </div>
          <span class="wa-action">⌕</span>
          <span class="wa-action">⋮</span>
        </div>

        <div class="wa-chat">
          <div class="wa-date">今天</div>
          <div class="wa-message-card">
            <div class="wa-image-box">
              <el-image
                v-if="form.imageUrl"
                :src="form.imageUrl"
                fit="cover"
                class="wa-image"
              />
              <div v-else class="wa-image-placeholder">
                <div class="wa-image-placeholder-title">营销主图</div>
                <div>Upload image preview</div>
              </div>
            </div>

            <div class="wa-template-name">
              模板：{{ form.templateName || "未命名模板" }}
            </div>
            <div class="wa-content">
              {{ form.content || "请输入内容" }}
            </div>
            <div class="wa-text">
              {{ form.text || "请输入文本" }}
            </div>

            <div v-if="form.promotionLink" class="wa-link-preview">
              <div class="wa-link-title">{{ linkDomain }}</div>
              <div class="wa-link-url">{{ form.promotionLink }}</div>
            </div>

            <div class="wa-message-footer">
              <span>{{ bottomText }}</span>
              <span>18:25 ✓✓</span>
            </div>

            <div v-if="form.linkMode === 'BUTTON'" class="wa-buttons">
              <el-button
                v-for="button in form.buttons"
                :key="button.id"
                plain
                type="primary"
                class="wa-button"
              >
                {{ button.label || "按钮" }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.marketing-template-preview {
  border-radius: 4px;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.phone-shell {
  max-width: 315px;
  padding: 10px;
  margin: 0 auto;
  border-radius: 34px;
  background: #0f172a;
  box-shadow: 0 14px 34px rgb(15 23 42 / 16%);
}

.phone-screen {
  overflow: hidden;
  min-height: 505px;
  border-radius: 26px;
  background: #efe7d8;
}

.phone-status {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  height: 40px;
  padding: 0 18px;
  color: #fff;
  background: #07111f;
  font-size: 11px;
  font-weight: 700;
}

.phone-status span:last-child {
  text-align: right;
}

.phone-notch {
  width: 74px;
  height: 20px;
  border-radius: 12px;
  background: #020617;
}

.wa-topbar {
  display: grid;
  grid-template-columns: 20px 32px 1fr 18px 14px;
  gap: 8px;
  align-items: center;
  min-height: 52px;
  padding: 0 10px;
  color: #fff;
  background: #0f6f5c;
}

.wa-back {
  font-size: 26px;
  line-height: 1;
}

.wa-avatar {
  background: #45c78f;
  color: #fff;
  font-weight: 700;
}

.wa-name {
  font-size: 15px;
  font-weight: 800;
}

.wa-online {
  color: rgb(255 255 255 / 76%);
  font-size: 11px;
}

.wa-action {
  font-size: 17px;
  text-align: center;
}

.wa-chat {
  min-height: 413px;
  padding: 12px 10px;
  background:
    radial-gradient(
      circle at 18px 26px,
      rgb(42 59 72 / 8%) 2px,
      transparent 3px
    ),
    radial-gradient(
      circle at 54px 74px,
      rgb(42 59 72 / 6%) 2px,
      transparent 3px
    ),
    #efe7d8;
  background-size: 88px 96px;
}

.wa-date {
  width: fit-content;
  padding: 4px 12px;
  margin: 0 auto 10px;
  border-radius: 999px;
  color: #64748b;
  background: #e8f2ef;
  font-size: 11px;
  font-weight: 600;
}

.wa-message-card {
  display: grid;
  gap: 7px;
  padding: 7px 7px 8px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 6px rgb(15 23 42 / 12%);
}

.wa-image-box {
  overflow: hidden;
  min-height: 150px;
  border-radius: 7px;
  background: #e8fff5;
}

.wa-image {
  width: 100%;
  height: 160px;
}

.wa-image-placeholder {
  display: grid;
  place-content: center;
  height: 160px;
  color: #78909c;
  text-align: center;
  line-height: 1.55;
  background: linear-gradient(135deg, #eefdf7, #e5f7f4);
  font-size: 12px;
}

.wa-image-placeholder-title {
  font-weight: 700;
}

.wa-template-name {
  color: #64748b;
  font-size: 11px;
}

.wa-content {
  color: #111827;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.45;
  white-space: pre-wrap;
}

.wa-text {
  color: #475569;
  font-size: 12px;
  line-height: 1.45;
  white-space: pre-wrap;
}

.wa-link-preview {
  display: grid;
  gap: 3px;
  padding: 7px 9px;
  border-left: 3px solid #22c55e;
  border-radius: 7px;
  background: #f4f6f8;
  font-size: 12px;
}

.wa-link-title {
  color: #111827;
  font-weight: 800;
}

.wa-link-url {
  overflow: hidden;
  color: #64748b;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wa-message-footer {
  display: flex;
  justify-content: space-between;
  color: #94a3b8;
  font-size: 10px;
}

.wa-buttons {
  display: grid;
  gap: 6px;
  padding-top: 2px;
}

.wa-button {
  width: 100%;
}
</style>
