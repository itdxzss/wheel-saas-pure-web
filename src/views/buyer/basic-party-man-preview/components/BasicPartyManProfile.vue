<script setup lang="ts">
import type { BasicPartyManProfile } from "../domain/basic-party-man";

defineProps<{
  profile: BasicPartyManProfile;
}>();

const emit = defineEmits<{
  back: [];
  chat: [];
}>();
</script>

<template>
  <section class="party-profile">
    <header class="profile-nav">
      <el-button text aria-label="返回匹配列表" @click="emit('back')">
        ←
      </el-button>
      <strong>{{ profile.handle }}</strong>
      <span>⋮</span>
    </header>

    <div class="profile-summary">
      <div
        class="profile-avatar"
        :style="{
          '--profile-accent': profile.accent,
          '--profile-tone': profile.photoTones[0]
        }"
      >
        {{ profile.name.slice(0, 1) }}
      </div>
      <h1>{{ profile.name }}</h1>
      <small
        >{{ profile.handle }} · {{ profile.age }}岁 · {{ profile.city }}</small
      >
      <p>{{ profile.bio }}</p>
      <el-button class="message-button" type="primary" @click="emit('chat')">
        ▰ 信息
      </el-button>
    </div>

    <div class="profile-tabs">
      <span>▦</span>
      <span>♡</span>
    </div>

    <div class="profile-gallery">
      <article
        v-for="(tone, index) in [...profile.photoTones, ...profile.photoTones]"
        :key="`${tone}-${index}`"
        :style="{
          '--profile-tone': tone,
          '--profile-accent': profile.accent,
          '--profile-index': index
        }"
      >
        <span v-if="index % 3 === 1">{{ profile.city }}</span>
      </article>
    </div>
  </section>
</template>

<style scoped>
.party-profile {
  min-height: 100vh;
  color: #fff;
  background: #050505;
}

.profile-nav {
  display: grid;
  grid-template-columns: 48px 1fr 48px;
  align-items: center;
  min-height: 58px;
  padding: 0 12px;
  border-bottom: 1px solid rgb(255 255 255 / 10%);
}

.profile-nav strong {
  text-align: center;
}

.profile-nav span {
  font-size: 24px;
  text-align: center;
}

.profile-nav .el-button {
  font-size: 28px;
  color: #fff;
}

.profile-summary {
  display: grid;
  justify-items: center;
  padding: 22px 16px 18px;
  text-align: center;
}

.profile-avatar {
  display: grid;
  place-items: center;
  width: 98px;
  height: 98px;
  font-size: 34px;
  font-weight: 900;
  color: #32131e;
  background:
    radial-gradient(circle at 50% 36%, #f9e5d7 0 18%, transparent 19%),
    linear-gradient(145deg, var(--profile-tone), var(--profile-accent));
  border: 3px solid var(--profile-accent);
  border-radius: 50%;
}

.profile-summary h1 {
  margin: 14px 0 4px;
  font-size: 25px;
}

.profile-summary small,
.profile-summary p {
  color: rgb(255 255 255 / 58%);
}

.profile-summary p {
  margin: 12px 0 18px;
}

.message-button {
  width: min(100%, 380px);
  min-height: 46px;
  font-weight: 800;
  background: var(--party-theme);
  border: 0;
}

.profile-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  text-align: center;
  border-top: 1px solid rgb(255 255 255 / 9%);
  border-bottom: 1px solid rgb(255 255 255 / 9%);
}

.profile-tabs span {
  padding: 12px;
  font-size: 20px;
}

.profile-tabs span:first-child {
  border-bottom: 2px solid var(--party-theme);
}

.profile-gallery {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 2px;
}

.profile-gallery article {
  position: relative;
  aspect-ratio: 0.82;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 28%, #f1d4c6 0 13%, transparent 14%),
    linear-gradient(
      calc(125deg + var(--profile-index) * 9deg),
      var(--profile-tone),
      var(--profile-accent)
    );
}

.profile-gallery article::after {
  position: absolute;
  inset: 42% 14% -8%;
  content: "";
  background: rgb(25 12 16 / 32%);
  border-radius: 46% 46% 0 0;
}

.profile-gallery span {
  position: absolute;
  right: 8px;
  bottom: 8px;
  z-index: 1;
  padding: 2px 7px;
  font-size: 11px;
  background: rgb(0 0 0 / 54%);
  border-radius: 999px;
}
</style>
