<script setup lang="ts">
import type { DateV2Profile } from "../domain/date-v2-preview";

defineProps<{
  profile: DateV2Profile;
  compact?: boolean;
}>();
</script>

<template>
  <div
    class="profile-art"
    :class="{ 'is-compact': compact }"
    :style="{ background: profile.gradient }"
    role="img"
    :aria-label="`${profile.name} 的模拟头像`"
  >
    <div class="profile-art__glow" />
    <div class="profile-art__portrait">
      <span class="profile-art__face">{{ profile.name.slice(0, 1) }}</span>
      <span class="profile-art__accent">{{ profile.emoji }}</span>
    </div>
    <div v-if="!compact" class="profile-art__caption">
      <strong>{{ profile.name }}, {{ profile.age }}</strong>
      <span>{{ profile.city }}</span>
    </div>
  </div>
</template>

<style scoped>
.profile-art {
  position: relative;
  min-height: 220px;
  overflow: hidden;
  color: #fff;
  border-radius: 24px;
  isolation: isolate;
}

.profile-art.is-compact {
  min-height: 96px;
  border-radius: 16px;
}

.profile-art__glow {
  position: absolute;
  top: -30%;
  right: -20%;
  width: 80%;
  aspect-ratio: 1;
  background: rgb(255 255 255 / 28%);
  border-radius: 50%;
  filter: blur(8px);
}

.profile-art__portrait {
  position: absolute;
  inset: 14% 12% 0;
  display: grid;
  place-items: center;
}

.profile-art__face {
  display: grid;
  place-items: center;
  width: min(70%, 150px);
  aspect-ratio: 1;
  font-size: clamp(42px, 12vw, 76px);
  font-weight: 800;
  color: rgb(255 255 255 / 86%);
  background: rgb(33 17 39 / 20%);
  border: 3px solid rgb(255 255 255 / 35%);
  border-radius: 50%;
  box-shadow: 0 24px 50px rgb(31 11 28 / 24%);
}

.is-compact .profile-art__face {
  width: 64px;
  font-size: 30px;
}

.profile-art__accent {
  position: absolute;
  right: 2%;
  bottom: 18%;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  font-size: 22px;
  background: rgb(255 255 255 / 92%);
  border-radius: 50%;
  box-shadow: 0 10px 24px rgb(35 12 30 / 24%);
}

.profile-art__caption {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 38px 16px 14px;
  background: linear-gradient(transparent, rgb(20 8 20 / 78%));
}

.profile-art__caption span {
  font-size: 12px;
  opacity: 0.8;
}
</style>
