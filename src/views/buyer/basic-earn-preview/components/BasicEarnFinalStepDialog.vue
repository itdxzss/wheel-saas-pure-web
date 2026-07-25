<script setup lang="ts">
import { ChatDotRound } from "@element-plus/icons-vue";

defineProps<{
  themeColor: string;
}>();

const visible = defineModel<boolean>({ required: true });

const emit = defineEmits<{
  continue: [];
}>();

function continueToReward(): void {
  visible.value = false;
  emit("continue");
}
</script>

<template>
  <el-dialog
    v-model="visible"
    class="basic-earn-final-dialog"
    :style="{ '--earn-theme': themeColor }"
    width="min(580px, calc(100vw - 24px))"
    append-to-body
    align-center
    :show-close="false"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <div class="final-step">
      <div class="whatsapp-icon" aria-hidden="true">
        <el-icon><ChatDotRound /></el-icon>
      </div>
      <h2>最后一步！</h2>
      <p>
        我们的团队会通过 WhatsApp 联系你，送达你的奖励。<br />
        点击下方即可开放
        <strong>WhatsApp 星级联系人</strong>
        这样你就不会错过我们的信息。
      </p>
      <el-button type="primary" @click="continueToReward">
        <el-icon><ChatDotRound /></el-icon>
        开放 WhatsApp 星级联系人
      </el-button>
    </div>
  </el-dialog>
</template>

<style scoped>
.final-step {
  padding: 20px 14px 8px;
  color: #292520;
  text-align: center;
}

.whatsapp-icon {
  display: grid;
  place-items: center;
  width: 92px;
  height: 92px;
  margin: 0 auto 30px;
  font-size: 51px;
  color: color-mix(in srgb, var(--earn-theme) 84%, #965300);
  background: color-mix(in srgb, var(--earn-theme) 25%, #fff8e9);
  border: 1px solid color-mix(in srgb, var(--earn-theme) 52%, #f0d49f);
  border-radius: 22px;
  box-shadow: 0 18px 38px color-mix(in srgb, var(--earn-theme) 24%, transparent);
}

.final-step h2 {
  margin: 0;
  font-size: clamp(29px, 6vw, 38px);
}

.final-step p {
  margin: 18px auto 34px;
  font-size: clamp(16px, 3vw, 20px);
  line-height: 1.75;
  color: #817970;
}

.final-step strong {
  color: color-mix(in srgb, var(--earn-theme) 80%, #a15c00);
}

.final-step .el-button {
  width: 100%;
  min-height: 68px;
  font-size: 19px;
  font-weight: 900;
  color: #2c2318;
  background: var(--earn-theme);
  border: 0;
  border-radius: 20px;
  box-shadow: 0 15px 32px color-mix(in srgb, var(--earn-theme) 30%, transparent);
}

.final-step .el-icon {
  margin-right: 10px;
  font-size: 24px;
}

:global(.basic-earn-final-dialog) {
  padding: 26px 24px;
  background: #fff;
  border: 1px solid #d8d0c4;
  border-top: 5px solid var(--earn-theme);
  border-radius: 34px;
  box-shadow: 0 32px 95px rgb(0 0 0 / 28%);
}

:global(.basic-earn-final-dialog .el-dialog__header) {
  display: none;
}

@media (width <= 500px) {
  :global(.basic-earn-final-dialog) {
    padding: 20px 10px;
  }

  .final-step {
    padding-inline: 5px;
  }
}
</style>
