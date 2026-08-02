<script setup lang="ts">
import { nextTick, ref } from "vue";
import type { BasicPartyManProfile } from "../domain/basic-party-man";

const props = defineProps<{
  profile: BasicPartyManProfile;
}>();

const emit = defineEmits<{
  back: [];
}>();

const draft = ref("");
const messages = ref<string[]>([]);

async function sendMessage(): Promise<void> {
  const message = draft.value.trim();
  if (!message) return;
  messages.value.push(message);
  draft.value = "";
  await nextTick();
}
</script>

<template>
  <section class="party-chat">
    <header class="chat-header">
      <el-button text aria-label="返回个人主页" @click="emit('back')">
        ←
      </el-button>
      <div
        class="chat-avatar"
        :style="{
          '--chat-tone': profile.photoTones[0],
          '--chat-accent': profile.accent
        }"
      >
        {{ profile.name.slice(0, 1) }}
      </div>
      <div>
        <strong>{{ profile.name }}</strong>
        <small>● 现已活跃</small>
      </div>
    </header>

    <main class="chat-body">
      <span class="chat-time">现在</span>
      <div class="chat-notice">
        ★ 一旦匹配确认，她将出现在你的 WhatsApp 星级联系人中 ★
      </div>
      <div v-if="!messages.length" class="chat-empty">
        <div class="chat-empty__icon">♡</div>
        <h1>开始聊天</h1>
        <p>向 {{ profile.name }} 发送第一条信息</p>
      </div>
      <div v-else class="chat-messages">
        <p v-for="(message, index) in messages" :key="`${message}-${index}`">
          {{ message }}
        </p>
      </div>
    </main>

    <footer class="chat-compose">
      <el-button circle aria-label="添加附件">＋</el-button>
      <el-input
        v-model="draft"
        placeholder="信息……"
        maxlength="200"
        @keyup.enter="sendMessage"
      />
      <el-button
        class="chat-send"
        circle
        aria-label="发送信息"
        @click="sendMessage"
      >
        ➤
      </el-button>
    </footer>
  </section>
</template>

<style scoped>
.party-chat {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
  color: #fff;
  background:
    radial-gradient(circle at 50% 0, rgb(85 13 42 / 22%), transparent 36%),
    #080104;
}

.chat-header {
  display: grid;
  grid-template-columns: 46px 44px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  min-height: 64px;
  padding: 0 14px;
  border-top: 2px solid var(--party-theme);
  border-bottom: 1px solid rgb(255 255 255 / 10%);
}

.chat-header .el-button {
  font-size: 26px;
  color: #fff;
}

.chat-avatar {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  color: #2e111c;
  background: linear-gradient(145deg, var(--chat-tone), var(--chat-accent));
  border: 2px solid var(--chat-accent);
  border-radius: 50%;
}

.chat-header div:last-child {
  display: grid;
}

.chat-header small {
  color: #32d47d;
}

.chat-body {
  display: grid;
  align-content: start;
  justify-items: center;
  min-height: 0;
  padding: 24px 16px;
  overflow-y: auto;
}

.chat-time {
  padding: 4px 14px;
  font-size: 12px;
  color: rgb(255 255 255 / 42%);
  background: rgb(255 255 255 / 7%);
  border-radius: 999px;
}

.chat-notice {
  max-width: 520px;
  padding: 10px 14px;
  margin-top: 26px;
  font-size: 13px;
  color: #ffe4a6;
  text-align: center;
  background: rgb(96 55 8 / 42%);
  border: 1px solid rgb(218 148 23 / 34%);
  border-radius: 12px;
}

.chat-empty {
  display: grid;
  place-items: center;
  margin: 15vh 0;
  text-align: center;
}

.chat-empty__icon {
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  font-size: 52px;
  color: var(--party-theme);
  background: color-mix(in srgb, var(--party-theme) 14%, transparent);
  border-radius: 50%;
}

.chat-empty h1 {
  margin: 16px 0 4px;
}

.chat-empty p {
  color: rgb(255 255 255 / 46%);
}

.chat-messages {
  display: grid;
  justify-items: end;
  width: min(100%, 720px);
  margin-top: 40px;
}

.chat-messages p {
  max-width: 76%;
  padding: 10px 14px;
  margin: 4px 0;
  background: color-mix(in srgb, var(--party-theme) 36%, #28131c);
  border-radius: 16px 16px 3px;
}

.chat-compose {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 42px;
  gap: 8px;
  padding: 12px max(12px, calc((100vw - 900px) / 2));
  background: #10070b;
  border-top: 1px solid rgb(255 255 255 / 10%);
}

.chat-compose :deep(.el-input__wrapper) {
  background: rgb(255 255 255 / 5%);
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 999px;
  box-shadow: none;
}

.chat-compose :deep(.el-input__inner) {
  color: #fff;
}

.chat-send {
  color: #fff;
  background: var(--party-theme);
  border-color: var(--party-theme);
}
</style>
