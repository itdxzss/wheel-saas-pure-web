<script setup lang="ts">
import type { DateV2Profile } from "../domain/date-v2-preview";
import MockProfileArt from "./MockProfileArt.vue";

defineProps<{
  profiles: DateV2Profile[];
  showAppDownload: boolean;
}>();

defineEmits<{
  login: [];
}>();
</script>

<template>
  <section class="landing">
    <header class="landing__hero">
      <div class="landing__brand">My love day</div>
      <div class="landing__promise">
        <span class="landing__heart">♡</span>
        <div>
          <strong>用 WhatsApp 登录，与附近的新朋友视频聊天</strong>
          <p>发现真实资料，开启轻松约会</p>
        </div>
      </div>
    </header>

    <div class="landing__grid">
      <article
        v-for="(profile, profileIndex) in profiles"
        :key="profile.id"
        class="landing__card"
        :class="{ 'is-tall': profileIndex % 3 === 1 }"
      >
        <span v-if="profileIndex !== 0" class="landing__new">NEW</span>
        <MockProfileArt :profile="profile" />
        <button
          class="landing__play"
          type="button"
          :aria-label="`查看 ${profile.name}`"
          @click="$emit('login')"
        >
          ▶
        </button>
      </article>
    </div>

    <section
      class="landing__features"
      :class="{ 'has-downloads': showAppDownload }"
    >
      <div>
        <span>AI</span>
        <strong>智能匹配</strong>
      </div>
      <div>
        <span>💬</span>
        <strong>即时聊天</strong>
      </div>
      <div>
        <span>◎</span>
        <strong>附近的人</strong>
      </div>
    </section>

    <section v-if="showAppDownload" class="landing__downloads">
      <p>下载应用，发现更多精彩内容</p>
      <div class="landing__download-badges">
        <div class="landing__download-badge">
          <span>▶</span>
          <div><small>GET IT ON</small><strong>Google Play</strong></div>
        </div>
        <div class="landing__download-badge">
          <span>●</span>
          <div><small>Download on the</small><strong>App Store</strong></div>
        </div>
      </div>
    </section>

    <footer class="landing__footer">
      <button class="landing__cta" type="button" @click="$emit('login')">
        用 WhatsApp 登录
      </button>
      <p>继续即表示你已年满 18 周岁并同意服务条款</p>
    </footer>
  </section>
</template>

<style scoped>
.landing {
  width: min(100%, 520px);
  min-height: 100vh;
  margin: 0 auto;
  color: #fff;
  background: #100b10;
  box-shadow: 0 0 80px rgb(0 0 0 / 55%);
}

.landing__hero {
  padding: 34px 24px 24px;
  background:
    radial-gradient(
      circle at 80% 0%,
      color-mix(in srgb, var(--date-theme) 55%, transparent),
      transparent 44%
    ),
    linear-gradient(160deg, #2d1726, #100b10 72%);
}

.landing__brand {
  font-size: clamp(44px, 12vw, 68px);
  font-style: italic;
  font-weight: 900;
  line-height: 1;
  color: var(--date-theme);
  text-align: center;
  text-shadow: 0 8px 26px color-mix(in srgb, var(--date-theme) 48%, transparent);
  transform: rotate(-2deg);
}

.landing__promise {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-top: 24px;
}

.landing__promise p {
  margin: 6px 0 0;
  font-size: 14px;
  color: rgb(255 255 255 / 68%);
}

.landing__heart {
  display: grid;
  flex: 0 0 64px;
  place-items: center;
  height: 64px;
  font-size: 48px;
  line-height: 1;
  background: var(--date-theme);
  border-radius: 18px;
  box-shadow: 0 12px 30px color-mix(in srgb, var(--date-theme) 45%, transparent);
}

.landing__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  padding: 4px;
}

.landing__card {
  position: relative;
  overflow: hidden;
  background: #1c131c;
  border-radius: 18px;
}

.landing__card.is-tall :deep(.profile-art) {
  min-height: 280px;
}

.landing__new {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 2;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 800;
  color: #fff;
  background: var(--date-theme);
  border-radius: 999px;
}

.landing__play {
  position: absolute;
  right: 16px;
  bottom: 48px;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  padding: 0 0 0 3px;
  color: #fff;
  cursor: pointer;
  background: color-mix(in srgb, var(--date-theme) 82%, #341b2c);
  border: 2px solid rgb(255 255 255 / 55%);
  border-radius: 50%;
}

.landing__features {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  padding: 22px 18px 160px;
}

.landing__features.has-downloads {
  padding-bottom: 22px;
}

.landing__features div {
  display: grid;
  gap: 6px;
  min-height: 104px;
  padding: 18px 8px;
  text-align: center;
  background: linear-gradient(160deg, #281c27, #171017);
  border: 1px solid rgb(255 255 255 / 8%);
  border-radius: 20px;
}

.landing__features span {
  font-size: 30px;
  font-weight: 900;
  color: var(--date-theme);
}

.landing__features strong {
  font-size: 13px;
}

.landing__downloads {
  padding: 0 18px 168px;
  text-align: center;
}

.landing__downloads p {
  margin: 0 0 12px;
  font-size: 13px;
  color: rgb(255 255 255 / 62%);
}

.landing__download-badges {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.landing__download-badge {
  display: flex;
  gap: 9px;
  align-items: center;
  justify-content: center;
  min-height: 58px;
  padding: 8px 12px;
  text-align: left;
  background: #050505;
  border: 1px solid rgb(255 255 255 / 22%);
  border-radius: 12px;
}

.landing__download-badge > span {
  font-size: 25px;
  color: var(--date-theme);
}

.landing__download-badge div {
  display: grid;
}

.landing__download-badge small {
  font-size: 9px;
  color: rgb(255 255 255 / 62%);
}

.landing__download-badge strong {
  font-size: 14px;
}

.landing__footer {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 4;
  width: min(100%, 520px);
  padding: 18px 22px max(14px, env(safe-area-inset-bottom));
  margin: 0 auto;
  background: linear-gradient(transparent, rgb(10 6 10 / 98%) 28%);
}

.landing__cta {
  width: 100%;
  min-height: 64px;
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  cursor: pointer;
  background: var(--date-theme);
  border: 0;
  border-radius: 999px;
  box-shadow: 0 16px 34px color-mix(in srgb, var(--date-theme) 38%, transparent);
}

.landing__footer p {
  margin: 9px 0 0;
  font-size: 11px;
  color: rgb(255 255 255 / 45%);
  text-align: center;
}

@media (width <= 420px) {
  .landing__hero {
    padding-inline: 18px;
  }

  .landing__promise strong {
    font-size: 14px;
  }

  .landing__heart {
    flex-basis: 54px;
    height: 54px;
    font-size: 38px;
  }
}
</style>
