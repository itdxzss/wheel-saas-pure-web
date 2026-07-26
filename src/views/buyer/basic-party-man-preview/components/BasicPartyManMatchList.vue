<script setup lang="ts">
import type { BasicPartyManProfile } from "../domain/basic-party-man";

defineProps<{
  profiles: BasicPartyManProfile[];
}>();

const emit = defineEmits<{
  openProfile: [profileId: string];
  cancel: [];
}>();
</script>

<template>
  <section class="party-matches">
    <header class="party-matches__notice">
      <span>!</span>
      请不要登出或取消绑定您的设备。匹配成功后，我们将通过以下方式向您发送最新动态。
    </header>

    <div class="party-matches__heading">
      <div class="heart">♡</div>
      <h1>匹配进行中……</h1>
      <p>在等待的同时浏览我们的高级会员</p>
    </div>

    <el-button class="cancel-pairing" plain @click="emit('cancel')">
      取消配对/解除绑定设备
    </el-button>

    <div class="member-list">
      <article
        v-for="profile in profiles"
        :key="profile.id"
        class="member-card"
        tabindex="0"
        role="button"
        @click="emit('openProfile', profile.id)"
        @keyup.enter="emit('openProfile', profile.id)"
      >
        <div
          class="member-avatar"
          :style="{
            '--avatar-accent': profile.accent,
            '--avatar-tone': profile.photoTones[0]
          }"
        >
          {{ profile.name.slice(0, 1) }}
          <i />
        </div>
        <div class="member-summary">
          <strong>{{ profile.name }}</strong>
          <small>● {{ profile.activeText }}</small>
        </div>
        <span class="member-arrow">›</span>
        <div class="member-gallery">
          <span
            v-for="(tone, index) in profile.photoTones"
            :key="tone"
            :style="{
              '--photo-tone': tone,
              '--photo-accent': profile.accent,
              '--photo-index': index
            }"
          />
          <b>+{{ (profile.age % 7) + 2 }}</b>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.party-matches {
  position: relative;
  min-height: 100vh;
  padding: 20px max(18px, calc((100vw - 520px) / 2)) 80px;
  color: #fff;
  background:
    linear-gradient(rgb(11 2 8 / 63%), rgb(16 2 10 / 86%)),
    radial-gradient(circle at 52% 22%, #a45e4e 0 17%, transparent 42%),
    linear-gradient(120deg, #392016, #151113 48%, #3e1b25);
  background-attachment: fixed;
}

.party-matches__notice {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 13px 16px;
  font-size: 13px;
  color: #ffd886;
  background: rgb(106 68 14 / 58%);
  border: 1px solid rgb(255 189 52 / 36%);
  border-radius: 14px;
}

.party-matches__notice span {
  display: grid;
  flex: none;
  place-items: center;
  width: 20px;
  height: 20px;
  font-weight: 900;
  background: #f0b313;
  border-radius: 50%;
}

.party-matches__heading {
  display: grid;
  place-items: center;
  margin: 24px 0 12px;
  text-align: center;
}

.heart {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  font-size: 42px;
  color: #fff;
  background: var(--party-theme);
  border-radius: 50%;
  box-shadow: 0 12px 30px
    color-mix(in srgb, var(--party-theme) 38%, transparent);
}

.party-matches__heading h1 {
  margin: 14px 0 6px;
  font-size: 25px;
}

.party-matches__heading p {
  margin: 0;
  color: rgb(255 255 255 / 58%);
}

.cancel-pairing {
  width: 100%;
  margin-bottom: 14px;
  color: color-mix(in srgb, var(--party-theme) 78%, #fff);
  background: color-mix(in srgb, var(--party-theme) 10%, rgb(28 9 18 / 82%));
  border-color: color-mix(in srgb, var(--party-theme) 48%, transparent);
}

.member-list {
  display: grid;
  gap: 12px;
}

.member-card {
  display: grid;
  grid-template-columns: 50px minmax(0, 1fr) 24px;
  overflow: hidden;
  cursor: pointer;
  background: rgb(51 20 36 / 86%);
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 18px;
  transition: 0.2s ease;
}

.member-card:hover,
.member-card:focus-visible {
  border-color: color-mix(in srgb, var(--party-theme) 58%, transparent);
  transform: translateY(-2px);
}

.member-avatar {
  position: relative;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin: 12px 0 0 12px;
  font-weight: 800;
  color: #301521;
  background:
    radial-gradient(circle at 50% 38%, #f8e6dc 0 18%, transparent 19%),
    linear-gradient(145deg, var(--avatar-tone), var(--avatar-accent));
  border: 2px solid var(--avatar-accent);
  border-radius: 50%;
}

.member-avatar i {
  position: absolute;
  right: -2px;
  bottom: 0;
  width: 9px;
  height: 9px;
  background: #25d366;
  border: 2px solid #321422;
  border-radius: 50%;
}

.member-summary {
  display: grid;
  gap: 3px;
  align-content: center;
  min-width: 0;
  padding: 10px 8px;
}

.member-summary strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-summary small {
  color: rgb(255 255 255 / 50%);
}

.member-summary small::first-letter {
  color: #27d978;
}

.member-arrow {
  align-self: center;
  font-size: 28px;
  color: rgb(255 255 255 / 42%);
}

.member-gallery {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-column: 1 / -1;
  height: 92px;
  border-top: 1px solid rgb(255 255 255 / 8%);
}

.member-gallery span {
  background:
    radial-gradient(circle at 50% 25%, #f4d8c9 0 14%, transparent 15%),
    linear-gradient(
      calc(135deg + var(--photo-index) * 14deg),
      var(--photo-tone),
      var(--photo-accent)
    );
  border-right: 1px solid rgb(255 255 255 / 9%);
}

.member-gallery b {
  position: absolute;
  right: 10px;
  bottom: 10px;
  padding: 3px 7px;
  background: rgb(20 6 12 / 72%);
  border-radius: 999px;
}

@media (width <= 520px) {
  .party-matches {
    padding-inline: 12px;
  }
}
</style>
