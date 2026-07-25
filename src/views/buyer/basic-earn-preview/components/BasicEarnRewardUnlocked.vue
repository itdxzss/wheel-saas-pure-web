<script setup lang="ts">
import {
  CircleCheckFilled,
  Link,
  Plus,
  WarningFilled
} from "@element-plus/icons-vue";

defineProps<{
  showAppDownload: boolean;
}>();

const emit = defineEmits<{
  linkAnother: [];
  manageDevices: [];
}>();
</script>

<template>
  <div class="reward-unlocked-page">
    <div class="year-watermark" aria-hidden="true">2026</div>
    <header class="reward-header">
      <div class="brand">
        <span>★</span>
        <strong>RewardClub</strong>
      </div>
      <span class="live-badge"><i />现场活动</span>
    </header>

    <section class="unlocked-card">
      <div class="unlocked-card__topline" />
      <div class="success-icon" aria-hidden="true">
        <el-icon><CircleCheckFilled /></el-icon>
      </div>
      <h1>奖励解锁！</h1>
      <p class="subtitle">WhatsApp 已成功关联。你的奖励正在路上。</p>

      <div class="credit-status">
        <el-icon><CircleCheckFilled /></el-icon>
        <strong>账户验证，奖励已入账</strong>
      </div>

      <div class="warning-card">
        <el-icon><WarningFilled /></el-icon>
        <div>
          <p>
            拜托<strong>不要取消链接</strong>你的 WhatsApp。我们会通过 WhatsApp
            联系您，告知奖励申请流程<strong>2–3 天</strong>。
          </p>
          <div class="warning-meta">
            <strong>联系倒计时</strong>
            <span>第二天 23小时58分钟</span>
          </div>
          <el-progress
            :percentage="96"
            :show-text="false"
            :stroke-width="7"
            status="exception"
          />
        </div>
      </div>

      <el-button class="link-another" @click="emit('linkAnother')">
        <el-icon><Plus /></el-icon>
        链接另一个账户
      </el-button>
      <el-button class="manage-devices" @click="emit('manageDevices')">
        <el-icon><Link /></el-icon>
        取消配对/解除绑定设备
      </el-button>

      <section v-if="showAppDownload" class="download-area">
        <p>在手机上继续领取奖励</p>
        <div>
          <el-button> App Store</el-button>
          <el-button>▶ Google Play</el-button>
        </div>
      </section>
    </section>
  </div>
</template>

<style scoped>
.reward-unlocked-page {
  position: relative;
  width: min(100%, 520px);
  min-height: 100vh;
  padding: 14px 18px 40px;
  margin: 0 auto;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 50% 8%,
      color-mix(in srgb, var(--earn-theme) 8%, transparent),
      transparent 35%
    ),
    #fbf7ef;
}

.year-watermark {
  position: fixed;
  top: 53%;
  left: 50%;
  z-index: 0;
  font-size: clamp(170px, 36vw, 290px);
  font-weight: 900;
  line-height: 0.8;
  color: rgb(72 58 41 / 5%);
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.reward-header,
.unlocked-card {
  position: relative;
  z-index: 1;
}

.reward-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 4px 14px;
  border-bottom: 1px solid #ebe3d6;
}

.brand {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 19px;
}

.brand > span {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  color: #fff;
  background: var(--earn-theme);
  border-radius: 11px;
}

.live-badge {
  padding: 5px 11px;
  font-size: 12px;
  font-weight: 700;
  color: #239b55;
  background: #e9f8ee;
  border: 1px solid #cbeed6;
  border-radius: 999px;
}

.live-badge i {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 6px;
  background: #20b15a;
  border-radius: 50%;
}

.unlocked-card {
  padding: 34px 28px 28px;
  margin-top: 18px;
  overflow: hidden;
  text-align: center;
  background: rgb(255 255 255 / 94%);
  border: 1px solid #e1d7c7;
  border-radius: 28px;
  box-shadow: 0 18px 45px rgb(78 60 34 / 11%);
}

.unlocked-card__topline {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 5px;
  background: var(--earn-theme);
}

.success-icon {
  display: grid;
  place-items: center;
  width: 92px;
  height: 92px;
  margin: 0 auto 28px;
  font-size: 98px;
  color: var(--earn-theme);
  filter: drop-shadow(
    0 12px 18px color-mix(in srgb, var(--earn-theme) 24%, transparent)
  );
}

.unlocked-card h1 {
  margin: 0;
  font-size: clamp(27px, 6vw, 36px);
}

.subtitle {
  margin: 12px 0 22px;
  color: #8b8279;
}

.credit-status {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  padding: 14px;
  color: #1d9c52;
  background: #eaf8ef;
  border: 1px solid #c5ead2;
  border-radius: 16px;
}

.warning-card {
  display: grid;
  grid-template-columns: 22px 1fr;
  gap: 10px;
  padding: 16px;
  margin-top: 14px;
  color: #705e5c;
  text-align: left;
  background: #fff4f3;
  border: 1px solid #ffc4c1;
  border-radius: 16px;
}

.warning-card > .el-icon {
  margin-top: 2px;
  color: #ff5c5c;
}

.warning-card p {
  margin: 0 0 14px;
  font-size: 13px;
  line-height: 1.65;
}

.warning-card strong {
  color: #ef4d4d;
}

.warning-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 7px;
  font-size: 11px;
  color: #ef5a5a;
}

.unlocked-card > .el-button {
  width: 100%;
  min-height: 58px;
  margin: 14px 0 0;
  font-size: 16px;
  font-weight: 800;
  border-radius: 16px;
}

.link-another {
  color: #2e2417;
  background: var(--earn-theme);
  border-color: var(--earn-theme);
  box-shadow: 0 12px 25px color-mix(in srgb, var(--earn-theme) 22%, transparent);
}

.manage-devices {
  color: #ef4f55;
  background: #fff;
  border-color: #ff8f94;
}

.download-area {
  padding-top: 17px;
  margin-top: 18px;
  border-top: 1px solid #eee5d9;
}

.download-area p {
  margin: 0 0 10px;
  font-size: 12px;
  color: #968b80;
}

.download-area > div {
  display: flex;
  gap: 8px;
}

.download-area .el-button {
  flex: 1;
  margin: 0;
  color: #fff;
  background: #26231f;
  border: 0;
}

@media (width <= 420px) {
  .reward-unlocked-page {
    padding-inline: 12px;
  }

  .unlocked-card {
    padding-inline: 18px;
    border-radius: 22px;
  }
}
</style>
