<script setup lang="ts">
defineProps<{
  showAppDownload: boolean;
}>();

const emit = defineEmits<{
  requestAccess: [];
}>();
</script>

<template>
  <section class="party-landing">
    <header class="party-landing__topbar">
      <div class="nearby">
        <span v-for="index in 5" :key="index" class="nearby__avatar">
          {{ ["A", "M", "S", "R", "K"][index - 1] }}
        </span>
        <span class="nearby__status" />
        <span>你附近有 3,761 人</span>
      </div>
      <span class="live-badge">● 直播 · 现在匹配</span>
    </header>

    <div class="party-landing__content">
      <div class="brand">LoveSync</div>
      <h1>查看他们的私人照片和视频</h1>
      <p>联系她，见面</p>

      <div class="access-card">
        <div class="trust-row">
          <div><strong>100%私人</strong><span>加密</span></div>
          <div><strong>身份验证</strong><span>真实的女性</span></div>
          <div><strong>找 W$#</strong><span>即时匹配</span></div>
        </div>
        <button
          class="phone-preview"
          type="button"
          @click="emit('requestAccess')"
        >
          <span>🇮🇳</span><span>+91⌄</span>
          <span class="phone-preview__placeholder">输入你的 WhatsApp 号码</span>
        </button>
        <el-button class="unlock-button" @click="emit('requestAccess')">
          ◉ 通过 WhatsApp 解锁访问权限
        </el-button>
      </div>

      <p class="privacy-note">
        100%私人，你的号码永远不会被分享<br />仅限成人，没有任何金额交易
      </p>

      <div v-if="showAppDownload" class="store-row">
        <button type="button" @click="emit('requestAccess')">
          <span class="store-icon">▶</span
          ><span>GET IT ON<strong>Google Play</strong></span>
        </button>
        <button type="button" @click="emit('requestAccess')">
          <span class="store-icon">●</span
          ><span>Download on the<strong>App Store</strong></span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.party-landing {
  position: relative;
  display: grid;
  min-height: 100vh;
  overflow: hidden;
  color: #fff;
  background:
    linear-gradient(180deg, rgb(4 3 4 / 34%), rgb(17 2 10 / 82%)),
    radial-gradient(circle at 64% 24%, #a77361 0 17%, transparent 38%),
    radial-gradient(
      ellipse at 50% 48%,
      #4a241f 0 26%,
      #171012 58%,
      #070607 100%
    );
}

.party-landing::before,
.party-landing::after {
  position: absolute;
  pointer-events: none;
  content: "";
}

.party-landing::before {
  inset: -8% 10% 28%;
  background:
    radial-gradient(
      ellipse at 46% 35%,
      rgb(216 162 139 / 80%) 0 21%,
      transparent 22%
    ),
    radial-gradient(
      ellipse at 55% 75%,
      rgb(25 16 18 / 98%) 0 34%,
      transparent 35%
    );
  filter: blur(18px);
  transform: rotate(-6deg);
}

.party-landing::after {
  inset: 0;
  background: linear-gradient(
    90deg,
    rgb(0 0 0 / 34%),
    transparent 24% 72%,
    rgb(0 0 0 / 44%)
  );
}

.party-landing__topbar {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  font-size: 13px;
}

.nearby {
  display: flex;
  align-items: center;
}

.nearby__avatar {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  margin-left: -7px;
  font-size: 11px;
  font-weight: 800;
  background: linear-gradient(145deg, #f5b18d, #713952);
  border: 2px solid rgb(255 255 255 / 72%);
  border-radius: 50%;
}

.nearby__avatar:first-child {
  margin-left: 0;
}

.nearby__status {
  width: 8px;
  height: 8px;
  margin: 0 8px;
  background: #3cdc78;
  border-radius: 50%;
  box-shadow: 0 0 12px #3cdc78;
}

.live-badge {
  padding: 5px 12px;
  color: #78f3a5;
  background: rgb(18 114 62 / 70%);
  border: 1px solid rgb(83 239 144 / 34%);
  border-radius: 999px;
}

.party-landing__content {
  position: relative;
  z-index: 2;
  align-self: end;
  width: min(100% - 28px, 460px);
  padding: 96px 0 26px;
  margin: 0 auto;
  text-align: center;
}

.brand {
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(42px, 8vw, 68px);
  font-style: italic;
  color: var(--party-theme);
  text-shadow: 0 0 28px color-mix(in srgb, var(--party-theme) 72%, transparent);
}

.party-landing h1 {
  margin: 4px 0 0;
  font-size: clamp(16px, 3.2vw, 22px);
}

.party-landing__content > p {
  margin: 5px 0 20px;
  color: rgb(255 255 255 / 74%);
}

.access-card {
  padding: 14px;
  background: rgb(45 18 30 / 78%);
  border: 1px solid color-mix(in srgb, var(--party-theme) 35%, transparent);
  border-radius: 20px;
  box-shadow: 0 24px 54px rgb(0 0 0 / 44%);
  backdrop-filter: blur(16px);
}

.trust-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin-bottom: 12px;
}

.trust-row > div {
  display: grid;
  gap: 2px;
  padding: 3px 7px;
  border-right: 1px solid rgb(255 255 255 / 10%);
}

.trust-row > div:last-child {
  border-right: 0;
}

.trust-row strong {
  font-size: 12px;
}

.trust-row span {
  font-size: 10px;
  color: rgb(255 255 255 / 48%);
}

.phone-preview {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 10px;
  align-items: center;
  width: 100%;
  min-height: 52px;
  padding: 0 14px;
  color: #fff;
  text-align: left;
  cursor: pointer;
  background: rgb(9 6 9 / 72%);
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 13px;
}

.phone-preview__placeholder {
  color: rgb(255 255 255 / 40%);
}

.unlock-button {
  width: 100%;
  min-height: 50px;
  margin-top: 10px;
  font-weight: 800;
  color: #fff;
  background: color-mix(in srgb, var(--party-theme) 74%, #3d1f2c);
  border: 0;
  border-radius: 12px;
}

.privacy-note {
  font-size: 11px;
  line-height: 1.6;
}

.store-row {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.store-row button {
  display: flex;
  gap: 9px;
  align-items: center;
  min-width: 150px;
  padding: 7px 12px;
  color: #fff;
  text-align: left;
  cursor: pointer;
  background: #050505;
  border: 1px solid rgb(255 255 255 / 42%);
  border-radius: 8px;
}

.store-row button > span:last-child {
  display: grid;
  font-size: 9px;
}

.store-row strong {
  font-size: 16px;
}

.store-icon {
  font-size: 22px;
}

@media (width <= 560px) {
  .party-landing__topbar {
    padding: 14px 12px;
    font-size: 11px;
  }

  .nearby__avatar:nth-child(n + 4) {
    display: none;
  }

  .store-row button {
    min-width: 0;
  }
}
</style>
