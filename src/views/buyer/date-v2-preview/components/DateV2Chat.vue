<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { Icon } from "@iconify/vue/offline";
import { ElMessage } from "element-plus";
import { countryFlagIcon } from "../../channel/domain/channel-country-flag";
import type { DateV2Country, DateV2Profile } from "../domain/date-v2-preview";
import MockProfileArt from "./MockProfileArt.vue";

const props = defineProps<{
  country: DateV2Country;
  phone: string;
  profiles: DateV2Profile[];
  themeColor: string;
}>();

const joinVisible = ref(false);
const shareVisible = ref(false);
const whatsappVisible = ref(false);
const shareProgress = ref(0);
let joinTimer: ReturnType<typeof setTimeout> | undefined;

onMounted(() => {
  joinTimer = setTimeout(() => {
    joinVisible.value = true;
  }, 2200);
});

onBeforeUnmount(() => {
  if (joinTimer) clearTimeout(joinTimer);
});

function joinGroup(): void {
  joinVisible.value = false;
  shareVisible.value = true;
}

function openShareConfirmation(): void {
  whatsappVisible.value = true;
}

function confirmShare(): void {
  whatsappVisible.value = false;
  shareProgress.value = Math.min(100, shareProgress.value + 40);
  if (shareProgress.value >= 100) {
    ElMessage.success("演示流程已完成");
  } else {
    ElMessage.success("已模拟分享，请继续完成进度");
  }
}
</script>

<template>
  <section class="chat-page">
    <header class="chat-header">
      <button type="button" aria-label="返回">‹</button>
      <MockProfileArt :profile="profiles[0]" compact />
      <div class="chat-header__title">
        <strong>附近交友群 🔥</strong>
        <span>
          <Icon
            v-if="countryFlagIcon(country.code)"
            :icon="countryFlagIcon(country.code)!"
          />
          {{ country.dialCode }} {{ phone }} · 768 位成员
        </span>
      </div>
      <span class="chat-header__more">⋮</span>
    </header>

    <main class="chat-content">
      <div class="chat-date">今天</div>
      <div class="chat-encryption">🔒 消息和通话均受到端到端加密保护</div>
      <div class="chat-joined">你已通过邀请链接加入群聊</div>

      <article class="message-card">
        <strong>~ {{ profiles[1].name }} ✨</strong>
        <MockProfileArt :profile="profiles[1]" />
        <div class="message-card__meta">
          <span>▶ 预览视频</span>
          <span>00:41</span>
        </div>
      </article>

      <article class="message-card is-voice">
        <strong>~ {{ profiles[2].name }} 🎧</strong>
        <div class="voice-line">
          <span>▶</span>
          <span class="voice-wave">▂▅▃▆▂▇▅▃▆▂▅</span>
          <span>0:12</span>
        </div>
      </article>

      <article class="message-card message-card--gallery">
        <strong>~ {{ profiles[3].name }} 💗</strong>
        <div class="message-gallery">
          <MockProfileArt
            v-for="profile in profiles.slice(3, 6)"
            :key="profile.id"
            :profile="profile"
            compact
          />
        </div>
        <span class="message-card__forwarded">↪ 已转发</span>
      </article>
    </main>

    <footer class="chat-input">
      <span>＋</span>
      <span class="chat-input__placeholder">输入消息</span>
      <span>🎙</span>
    </footer>
  </section>

  <el-drawer
    v-model="joinVisible"
    class="date-v2-flow-sheet"
    :style="{ '--date-theme': themeColor }"
    direction="btt"
    size="42%"
    append-to-body
    :show-close="false"
    :with-header="false"
    :close-on-click-modal="false"
  >
    <div class="flow-sheet">
      <MockProfileArt :profile="profiles[0]" compact />
      <h2>附近交友群 🔥</h2>
      <p>已有 768 位附近用户加入</p>
      <div class="member-stack">
        <MockProfileArt
          v-for="profile in profiles.slice(1, 5)"
          :key="profile.id"
          :profile="profile"
          compact
        />
      </div>
      <strong>发现更多新朋友</strong>
      <el-button class="flow-action" type="primary" @click="joinGroup">
        加入我们的群聊
      </el-button>
    </div>
  </el-drawer>

  <el-drawer
    v-model="shareVisible"
    class="date-v2-flow-sheet"
    :style="{ '--date-theme': themeColor }"
    direction="btt"
    size="32%"
    append-to-body
    :show-close="false"
    :with-header="false"
    :close-on-click-modal="false"
  >
    <div class="flow-sheet flow-sheet--share">
      <h2>完成分享后加入群聊</h2>
      <p>请将邀请分享给两个 WhatsApp 好友</p>
      <el-progress
        :percentage="shareProgress"
        :stroke-width="12"
        :color="themeColor"
      />
      <el-button
        class="flow-action"
        type="primary"
        :disabled="shareProgress >= 100"
        @click="openShareConfirmation"
      >
        {{ shareProgress >= 100 ? "已完成" : "分享" }}
      </el-button>
    </div>
  </el-drawer>

  <el-dialog
    v-model="whatsappVisible"
    class="date-v2-whatsapp-dialog"
    :style="{ '--date-theme': themeColor }"
    title="要打开 WhatsApp 吗？"
    width="min(520px, calc(100vw - 24px))"
    append-to-body
    align-center
  >
    <p>这是开发期演示页面，确认后将模拟一次分享并更新进度。</p>
    <template #footer>
      <el-button @click="whatsappVisible = false">取消</el-button>
      <el-button type="primary" @click="confirmShare">打开 WhatsApp</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.chat-page {
  min-height: 100vh;
  padding-bottom: 68px;
  color: #26312e;
  background:
    linear-gradient(rgb(255 255 255 / 92%), rgb(255 255 255 / 92%)),
    radial-gradient(circle at 30% 20%, #ded8ca, #f4f0e8 70%);
}

.chat-header {
  position: sticky;
  top: 0;
  z-index: 3;
  display: grid;
  grid-template-columns: 28px 44px minmax(0, 1fr) 24px;
  gap: 10px;
  align-items: center;
  min-height: 68px;
  padding: 8px 14px;
  color: #fff;
  background: color-mix(in srgb, var(--date-theme) 58%, #00695c);
  box-shadow: 0 3px 12px rgb(0 0 0 / 16%);
}

.chat-header button {
  padding: 0;
  font-size: 34px;
  color: #fff;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.chat-header :deep(.profile-art) {
  width: 44px;
  min-height: 44px;
  border-radius: 50%;
}

.chat-header :deep(.profile-art__portrait) {
  inset: 0;
}

.chat-header :deep(.profile-art__face) {
  width: 38px;
  font-size: 18px;
}

.chat-header :deep(.profile-art__accent) {
  display: none;
}

.chat-header__title {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.chat-header__title strong,
.chat-header__title span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-header__title span {
  display: flex;
  gap: 5px;
  align-items: center;
  font-size: 11px;
  opacity: 0.82;
}

.chat-header__title svg {
  flex: 0 0 16px;
}

.chat-header__more {
  font-size: 24px;
}

.chat-content {
  display: grid;
  gap: 14px;
  width: min(100%, 720px);
  padding: 18px 14px 90px;
  margin: 0 auto;
}

.chat-date,
.chat-encryption,
.chat-joined {
  width: fit-content;
  padding: 6px 12px;
  margin: 0 auto;
  font-size: 12px;
  background: #fff;
  border-radius: 9px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 8%);
}

.chat-encryption {
  color: #776c45;
  background: #fff1bf;
}

.message-card {
  width: min(78%, 330px);
  padding: 10px;
  background: #fff;
  border-radius: 10px 10px 10px 2px;
  box-shadow: 0 2px 9px rgb(0 0 0 / 10%);
}

.message-card > strong {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: color-mix(in srgb, var(--date-theme) 72%, #4b3150);
}

.message-card :deep(.profile-art) {
  min-height: 270px;
}

.message-card__meta,
.voice-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #747c7a;
}

.message-card.is-voice {
  margin-left: 26px;
}

.voice-line {
  min-height: 46px;
  padding: 0 8px;
  color: color-mix(in srgb, var(--date-theme) 72%, #236c66);
  background: #f0f4f3;
  border-radius: 999px;
}

.voice-wave {
  overflow: hidden;
  letter-spacing: 2px;
  white-space: nowrap;
}

.message-card--gallery {
  width: min(90%, 430px);
}

.message-gallery {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
}

.message-gallery :deep(.profile-art) {
  min-height: 120px;
}

.message-card__forwarded {
  display: block;
  margin-top: 8px;
  font-size: 11px;
  color: #8b928f;
}

.chat-input {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 34px;
  gap: 8px;
  align-items: center;
  min-height: 62px;
  padding: 8px 14px max(8px, env(safe-area-inset-bottom));
  background: #f4f5f4;
  border-top: 1px solid #e3e6e5;
}

.chat-input__placeholder {
  padding: 10px 16px;
  color: #9aa09e;
  background: #fff;
  border-radius: 999px;
}

.flow-sheet {
  display: grid;
  gap: 10px;
  justify-items: center;
  height: 100%;
  color: #222;
  text-align: center;
}

.flow-sheet > :deep(.profile-art) {
  width: 76px;
  min-height: 76px;
  border-radius: 50%;
}

.flow-sheet > :deep(.profile-art__portrait) {
  inset: 0;
}

.flow-sheet > :deep(.profile-art__face) {
  width: 64px;
  font-size: 28px;
}

.flow-sheet > :deep(.profile-art__accent) {
  display: none;
}

.flow-sheet h2,
.flow-sheet p {
  margin: 0;
}

.flow-sheet p {
  color: #7c8381;
}

.member-stack {
  display: flex;
  justify-content: center;
  padding-left: 18px;
}

.member-stack :deep(.profile-art) {
  width: 48px;
  min-height: 48px;
  margin-left: -18px;
  border: 3px solid #fff;
  border-radius: 50%;
}

.member-stack :deep(.profile-art__portrait) {
  inset: 0;
}

.member-stack :deep(.profile-art__face) {
  width: 38px;
  font-size: 18px;
}

.member-stack :deep(.profile-art__accent) {
  display: none;
}

.flow-action {
  align-self: end;
  width: 100%;
  min-height: 48px;
  font-size: 17px;
  font-weight: 700;
  background: var(--date-theme);
  border: 0;
  border-radius: 999px;
}

.flow-sheet--share {
  align-content: center;
}

.flow-sheet--share :deep(.el-progress) {
  width: min(100%, 520px);
}

:global(.date-v2-flow-sheet) {
  border-radius: 24px 24px 0 0;
}

:global(.date-v2-flow-sheet .el-drawer__body) {
  padding: 22px max(18px, calc((100vw - 760px) / 2));
}

:global(.date-v2-whatsapp-dialog) {
  border-radius: 18px;
}

:global(.date-v2-whatsapp-dialog .el-button--primary) {
  background: var(--date-theme);
  border-color: var(--date-theme);
}

@media (width <= 560px) {
  .message-card {
    width: 86%;
  }

  :global(.date-v2-flow-sheet) {
    min-height: 330px;
  }
}
</style>
