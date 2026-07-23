<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";

const props = defineProps<{
  pairingCode: string;
  themeColor: string;
}>();

const visible = defineModel<boolean>({ required: true });
const emit = defineEmits<{
  resend: [];
}>();

const countdown = ref(10);
const showInstruction = ref(false);
let countdownTimer: ReturnType<typeof setInterval> | undefined;
let instructionTimer: ReturnType<typeof setTimeout> | undefined;

const formattedCode = computed(() => {
  const digits = props.pairingCode.replace(/\D/g, "").padEnd(8, "1");
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}`;
});

function clearTimers(): void {
  if (countdownTimer) clearInterval(countdownTimer);
  if (instructionTimer) clearTimeout(instructionTimer);
  countdownTimer = undefined;
  instructionTimer = undefined;
}

function startCountdown(): void {
  clearTimers();
  countdown.value = 10;
  showInstruction.value = false;
  instructionTimer = setTimeout(() => {
    showInstruction.value = true;
  }, 900);
  countdownTimer = setInterval(() => {
    if (countdown.value <= 1) {
      countdown.value = 0;
      if (countdownTimer) clearInterval(countdownTimer);
      countdownTimer = undefined;
      return;
    }
    countdown.value -= 1;
  }, 1000);
}

watch(visible, value => {
  if (value) startCountdown();
  else clearTimers();
});

onBeforeUnmount(clearTimers);

function resend(): void {
  if (countdown.value > 0) return;
  emit("resend");
  startCountdown();
}
</script>

<template>
  <el-dialog
    v-model="visible"
    class="basic-earn-guide-dialog"
    :style="{ '--earn-theme': themeColor }"
    width="min(560px, calc(100vw - 24px))"
    append-to-body
    align-center
    :show-close="false"
    :close-on-click-modal="false"
  >
    <div class="guide-content">
      <div class="guide-label"><span>⌕</span>WhatsApp 链接</div>
      <h2>你的配对码准备好了</h2>
      <p>代码复制！现在去 WhatsApp，<br />粘贴到链接界面。</p>

      <Transition name="instruction">
        <div v-if="showInstruction" class="instruction-card">
          <div class="device-symbol">▱</div>
          <strong>Are you trying to link<br />a device?</strong>
          <span>
            Chrome (Windows) is attempting to link to your WhatsApp account.
          </span>
          <div class="confirm-button">Confirm</div>
          <div class="hand" aria-hidden="true">☝</div>
          <small>Cancel</small>
        </div>
      </Transition>

      <p class="notification-tip">WhatsApp 通知将很快弹出。</p>
      <div class="code-reminder">
        <span>Your code:</span>
        <strong>{{ formattedCode }}</strong>
      </div>
      <el-button
        class="resend-button"
        type="primary"
        :disabled="countdown > 0"
        @click="resend"
      >
        {{ countdown > 0 ? `${countdown}秒后再送` : "重发码" }}
      </el-button>
    </div>
  </el-dialog>
</template>

<style scoped>
.guide-content {
  padding: 6px 12px 4px;
  color: #25211e;
}

.guide-label {
  display: flex;
  gap: 10px;
  align-items: center;
  font-weight: 700;
  color: #777069;
}

.guide-label span {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  color: #16aa58;
  background: #eafaf0;
  border: 1px solid #a7e4bd;
  border-radius: 11px;
}

.guide-content h2 {
  margin: 24px 0;
  font-size: clamp(26px, 6vw, 34px);
}

.guide-content > p {
  font-size: 17px;
  line-height: 1.55;
  color: #817a73;
  text-align: center;
}

.instruction-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 22px 20px;
  margin: 22px auto 16px;
  overflow: hidden;
  color: #fff;
  text-align: center;
  background: #111312;
  border-radius: 20px;
}

.device-symbol {
  display: grid;
  place-items: center;
  width: 74px;
  height: 74px;
  margin-bottom: 18px;
  font-size: 52px;
  color: #2776d0;
  background: #fff;
  border-radius: 50%;
}

.instruction-card > strong {
  font-size: 24px;
  line-height: 1.15;
}

.instruction-card > span {
  width: min(100%, 360px);
  margin: 17px 0;
  font-size: 14px;
  line-height: 1.45;
  color: #e0e0e0;
}

.confirm-button {
  width: 90%;
  padding: 12px;
  font-size: 18px;
  font-weight: 900;
  color: #092f18;
  background: #25d366;
  border-radius: 999px;
}

.hand {
  position: absolute;
  right: 16%;
  bottom: 28px;
  font-size: 48px;
  filter: drop-shadow(0 3px 5px rgb(0 0 0 / 30%));
  transform: rotate(-25deg);
  animation: tap 1.2s ease-in-out infinite;
}

.instruction-card small {
  margin-top: 16px;
  color: #28d46a;
}

.notification-tip {
  margin: 16px 0 12px;
  font-size: 14px !important;
  color: #aaa39c !important;
}

.code-reminder {
  display: flex;
  gap: 9px;
  align-items: center;
  justify-content: center;
  min-height: 58px;
  padding: 10px;
  background: color-mix(in srgb, var(--earn-theme) 6%, #fff);
  border: 1px solid color-mix(in srgb, var(--earn-theme) 35%, #eadfcd);
  border-radius: 16px;
}

.code-reminder span {
  color: #857e78;
}

.code-reminder strong {
  font-size: 23px;
  color: color-mix(in srgb, var(--earn-theme) 80%, #8d5000);
  letter-spacing: 2px;
}

.resend-button {
  width: 100%;
  min-height: 60px;
  margin-top: 22px;
  font-size: 18px;
  font-weight: 900;
  color: #2e2415;
  background: var(--earn-theme);
  border: 0;
  border-radius: 18px;
}

.resend-button.is-disabled {
  color: #aaa6a1;
  background: #f3f3f3;
}

.instruction-enter-active,
.instruction-leave-active {
  transition: 0.45s ease;
}

.instruction-enter-from,
.instruction-leave-to {
  opacity: 0;
  transform: scale(0.94);
}

@keyframes tap {
  50% {
    transform: translate(-8px, -8px) rotate(-25deg) scale(0.94);
  }
}

:global(.basic-earn-guide-dialog) {
  max-height: calc(100vh - 28px);
  padding: 26px 22px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #d9d1c5;
  border-top: 5px solid var(--earn-theme);
  border-radius: 32px;
  box-shadow: 0 30px 90px rgb(0 0 0 / 25%);
}

:global(.basic-earn-guide-dialog .el-dialog__header) {
  display: none;
}

@media (width <= 500px) {
  :global(.basic-earn-guide-dialog) {
    padding: 20px 8px;
  }

  .guide-content {
    padding-inline: 4px;
  }

  .instruction-card > strong {
    font-size: 21px;
  }

  .instruction-card > span {
    font-size: 12px;
  }
}
</style>
