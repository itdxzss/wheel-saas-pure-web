<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";

defineProps<{
  pairingCode: string;
  themeColor: string;
}>();

const visible = defineModel<boolean>({ required: true });
const remainingSeconds = ref(39);
const activeStep = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | undefined;
let animationTimer: ReturnType<typeof setInterval> | undefined;

const stepLabels = [
  "查看 WhatsApp 配对通知",
  "点击通知打开 WhatsApp",
  "在 WhatsApp 中粘贴配对码"
];

function clearTimers(): void {
  if (countdownTimer) clearInterval(countdownTimer);
  if (animationTimer) clearInterval(animationTimer);
  countdownTimer = undefined;
  animationTimer = undefined;
}

function startGuide(): void {
  clearTimers();
  remainingSeconds.value = 39;
  activeStep.value = 0;
  countdownTimer = setInterval(() => {
    remainingSeconds.value = Math.max(0, remainingSeconds.value - 1);
    if (remainingSeconds.value === 0 && countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = undefined;
    }
  }, 1000);
  animationTimer = setInterval(() => {
    activeStep.value = (activeStep.value + 1) % stepLabels.length;
  }, 2400);
}

watch(visible, isVisible => {
  if (isVisible) {
    startGuide();
  } else {
    clearTimers();
  }
});

onBeforeUnmount(clearTimers);
</script>

<template>
  <el-dialog
    v-model="visible"
    class="date-v2-guide-dialog"
    :style="{ '--date-theme': themeColor }"
    width="min(480px, calc(100vw - 28px))"
    append-to-body
    align-center
    :close-on-click-modal="false"
  >
    <section class="guide-panel">
      <h2>小贴士</h2>
      <p>配对码已复制，请粘贴到 WhatsApp</p>

      <div class="guide-animation" :class="`is-step-${activeStep}`">
        <div class="phone">
          <div class="phone__status">16:04　◉ ◉ ◉　▰</div>
          <div class="phone__screen">
            <div class="whatsapp-title">
              <span>‹</span>
              <span class="whatsapp-logo">W</span>
              <strong>WhatsApp</strong>
            </div>
            <div class="notification">
              <span class="notification__logo">W</span>
              <div>
                <strong>WhatsApp</strong>
                <p>输入代码关联设备</p>
              </div>
            </div>
            <div class="paste-card">
              <small>输入配对码</small>
              <strong>{{ pairingCode }}</strong>
            </div>
            <span class="tap-hand">☝</span>
          </div>
        </div>
      </div>

      <div class="guide-step">
        <span>步骤 {{ activeStep + 1 }}/3</span>
        <strong>{{ stepLabels[activeStep] }}</strong>
      </div>

      <p class="guide-reminder">请关注接下来的 WhatsApp 弹窗。</p>
      <div class="guide-code">
        <span>验证码：</span>
        <strong>{{ pairingCode }}</strong>
      </div>
      <div class="guide-countdown">
        {{ remainingSeconds > 0 ? `${remainingSeconds}S` : "等待确认" }}
      </div>
    </section>
  </el-dialog>
</template>

<style scoped>
.guide-panel {
  padding: 20px 18px 24px;
  color: #fff;
  text-align: center;
}

.guide-panel h2 {
  margin: 0;
  font-size: 30px;
  color: #ffd714;
}

.guide-panel > p {
  margin: 16px 0 20px;
  font-size: 17px;
  color: rgb(255 255 255 / 82%);
}

.guide-animation {
  position: relative;
  display: grid;
  place-items: end center;
  height: 320px;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 28%, rgb(255 255 255 / 8%), transparent 44%),
    #050505;
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 14px;
}

.phone {
  width: 78%;
  height: 286px;
  padding: 12px 8px 0;
  color: #1c1c1c;
  background: linear-gradient(145deg, #c6c6c8, #4c4c50 20%, #111 26%);
  border: 2px solid #737378;
  border-bottom: 0;
  border-radius: 42px 42px 0 0;
  box-shadow: 0 -8px 30px rgb(255 255 255 / 10%);
}

.phone__status {
  height: 26px;
  padding: 4px 12px;
  font-size: 11px;
  color: #fff;
  text-align: left;
}

.phone__screen {
  position: relative;
  height: calc(100% - 26px);
  overflow: hidden;
  background: #ece8e1;
  border-radius: 28px 28px 0 0;
}

.whatsapp-title {
  display: flex;
  gap: 8px;
  align-items: center;
  height: 52px;
  padding: 0 14px;
  color: #fff;
  background: #075e54;
}

.whatsapp-logo,
.notification__logo {
  display: grid;
  place-items: center;
  width: 27px;
  height: 27px;
  font-weight: 900;
  color: #fff;
  background: #25d366;
  border-radius: 50%;
}

.notification {
  position: absolute;
  top: 70px;
  right: 12px;
  left: 12px;
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px;
  text-align: left;
  background: rgb(255 255 255 / 96%);
  border: 2px solid var(--date-theme);
  border-radius: 14px;
  box-shadow: 0 10px 28px rgb(0 0 0 / 25%);
  transition: 0.45s ease;
}

.notification p,
.notification strong {
  display: block;
  margin: 0;
  font-size: 12px;
}

.notification p {
  margin-top: 3px;
  color: #555;
}

.paste-card {
  position: absolute;
  top: 98px;
  right: 22px;
  left: 22px;
  display: grid;
  gap: 10px;
  padding: 18px;
  color: #1d2a27;
  background: #fff;
  border: 2px solid #25d366;
  border-radius: 14px;
  opacity: 0;
  transform: translateY(38px) scale(0.94);
  transition: 0.45s ease;
}

.paste-card strong {
  font-size: 24px;
  letter-spacing: 4px;
}

.tap-hand {
  position: absolute;
  top: 126px;
  right: 36px;
  z-index: 2;
  font-size: 48px;
  opacity: 0;
  filter: drop-shadow(0 5px 4px rgb(0 0 0 / 24%));
  transform: translate(16px, 20px) rotate(-22deg);
  transition: 0.4s ease;
}

.is-step-1 .tap-hand {
  opacity: 1;
  transform: translate(0, 0) rotate(-22deg);
  animation: guide-tap 0.9s ease-in-out infinite;
}

.is-step-2 .notification {
  opacity: 0;
  transform: translateY(-20px);
}

.is-step-2 .paste-card {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.is-step-2 .tap-hand {
  top: 176px;
  right: 50%;
  opacity: 1;
  transform: translateX(50%) rotate(-8deg);
  animation: guide-tap 0.9s ease-in-out infinite;
}

.guide-step {
  display: grid;
  gap: 4px;
  margin-top: 12px;
}

.guide-step span {
  font-size: 12px;
  color: rgb(255 255 255 / 48%);
}

.guide-step strong {
  color: color-mix(in srgb, var(--date-theme) 74%, #fff);
}

.guide-reminder {
  font-weight: 700;
  color: color-mix(in srgb, var(--date-theme) 76%, #fff) !important;
}

.guide-code {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  min-height: 70px;
  padding: 12px;
  background: rgb(255 255 255 / 5%);
  border: 1px dashed var(--date-theme);
  border-radius: 14px;
}

.guide-code span {
  color: rgb(255 255 255 / 45%);
}

.guide-code strong {
  font-size: 22px;
  letter-spacing: 2px;
}

.guide-countdown {
  display: grid;
  place-items: center;
  min-height: 64px;
  margin-top: 22px;
  font-size: 20px;
  font-weight: 900;
  color: rgb(255 255 255 / 52%);
  background: color-mix(in srgb, var(--date-theme) 64%, #6f3c45);
  border: 2px solid color-mix(in srgb, var(--date-theme) 72%, #7a3e49);
  border-radius: 999px;
  box-shadow: 0 14px 28px color-mix(in srgb, var(--date-theme) 22%, transparent);
}

:global(.date-v2-guide-dialog) {
  color: #fff;
  background: rgb(16 14 15 / 98%);
  border: 2px solid color-mix(in srgb, var(--date-theme) 52%, #542d39);
  border-radius: 28px;
  box-shadow: 0 30px 90px rgb(0 0 0 / 76%);
}

:global(.date-v2-guide-dialog .el-dialog__header) {
  padding: 0;
}

:global(.date-v2-guide-dialog .el-dialog__headerbtn) {
  top: 18px;
  right: 18px;
  z-index: 3;
  width: 44px;
  height: 44px;
  background: rgb(255 255 255 / 12%);
  border-radius: 50%;
}

:global(.date-v2-guide-dialog .el-dialog__close) {
  color: #fff;
}

:global(.date-v2-guide-dialog .el-dialog__body) {
  padding: 0;
}

@keyframes guide-tap {
  0%,
  100% {
    scale: 1;
  }

  50% {
    scale: 0.82;
  }
}

@media (width <= 420px) {
  .guide-panel {
    padding-inline: 12px;
  }

  .guide-animation {
    height: 286px;
  }

  .phone {
    height: 258px;
  }
}
</style>
