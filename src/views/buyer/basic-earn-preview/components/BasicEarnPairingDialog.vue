<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { ElMessage } from "element-plus";

const props = defineProps<{
  pairingCode: string;
  themeColor: string;
}>();

const visible = defineModel<boolean>({ required: true });
const copyInput = ref<HTMLInputElement>();

const codeDigits = computed(() =>
  props.pairingCode.replace(/\D/g, "").padEnd(8, "1").slice(0, 8).split("")
);

const emit = defineEmits<{
  copied: [];
}>();

async function fallbackCopy(text: string): Promise<void> {
  await nextTick();
  if (!copyInput.value) throw new Error("copy input unavailable");
  copyInput.value.value = text;
  copyInput.value.select();
  if (!document.execCommand("copy")) throw new Error("copy failed");
}

async function copyPairingCode(): Promise<void> {
  const text = codeDigits.value.join("");
  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      await fallbackCopy(text);
    }
    ElMessage.success("复制了！");
    emit("copied");
  } catch {
    ElMessage.error("复制失败，请长按配对码复制");
  }
}
</script>

<template>
  <el-dialog
    v-model="visible"
    class="basic-earn-pairing-dialog"
    :style="{ '--earn-theme': themeColor }"
    width="min(560px, calc(100vw - 24px))"
    append-to-body
    align-center
    :show-close="false"
    :close-on-click-modal="false"
  >
    <div class="pairing-content">
      <div class="pairing-label"><span>⌕</span>WhatsApp 链接</div>
      <h2>你的配对码准备好了</h2>
      <p>点击下面的按钮复制你的代码，<br />然后粘贴到 WhatsApp。</p>
      <div class="code-row" aria-label="WhatsApp 配对码">
        <template v-for="(digit, index) in codeDigits" :key="index">
          <span v-if="index === 4" class="code-separator">-</span>
          <b>{{ digit }}</b>
        </template>
      </div>
      <el-button class="copy-button" type="primary" @click="copyPairingCode">
        <span>▣</span>复制代码
      </el-button>
      <input
        ref="copyInput"
        class="copy-input"
        tabindex="-1"
        aria-hidden="true"
      />
    </div>
  </el-dialog>
</template>

<style scoped>
.pairing-content {
  padding: 6px 12px 4px;
  color: #25211e;
}

.pairing-label {
  display: flex;
  gap: 10px;
  align-items: center;
  font-weight: 700;
  color: #777069;
}

.pairing-label span {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  color: #16aa58;
  background: #eafaf0;
  border: 1px solid #a7e4bd;
  border-radius: 11px;
}

.pairing-content h2 {
  margin: 24px 0 28px;
  font-size: clamp(26px, 6vw, 34px);
}

.pairing-content > p {
  font-size: 17px;
  line-height: 1.55;
  color: #817a73;
  text-align: center;
}

.code-row {
  display: flex;
  gap: 7px;
  align-items: center;
  justify-content: center;
  margin: 25px 0 30px;
}

.code-row b {
  display: grid;
  place-items: center;
  width: 51px;
  height: 62px;
  font-size: 28px;
  color: color-mix(in srgb, var(--earn-theme) 80%, #8c5300);
  background: color-mix(in srgb, var(--earn-theme) 7%, #fff);
  border: 1px solid color-mix(in srgb, var(--earn-theme) 58%, #f2dbba);
  border-radius: 15px;
}

.code-separator {
  margin-inline: 1px;
  color: color-mix(in srgb, var(--earn-theme) 50%, #c8b99d);
}

.copy-button {
  width: 100%;
  min-height: 62px;
  font-size: 18px;
  font-weight: 900;
  color: #2e2415;
  background: var(--earn-theme);
  border: 0;
  border-radius: 18px;
  box-shadow: 0 13px 30px color-mix(in srgb, var(--earn-theme) 25%, transparent);
}

.copy-button span {
  margin-right: 10px;
}

.copy-input {
  position: fixed;
  top: -1000px;
  left: -1000px;
}

:global(.basic-earn-pairing-dialog) {
  padding: 27px 22px;
  background: #fff;
  border: 1px solid #d9d1c5;
  border-top: 5px solid var(--earn-theme);
  border-radius: 32px;
  box-shadow: 0 30px 90px rgb(0 0 0 / 25%);
}

:global(.basic-earn-pairing-dialog .el-dialog__header) {
  display: none;
}

@media (width <= 500px) {
  :global(.basic-earn-pairing-dialog) {
    padding: 20px 8px;
  }

  .pairing-content {
    padding-inline: 4px;
  }

  .code-row {
    gap: 4px;
  }

  .code-row b {
    width: 38px;
    height: 54px;
    font-size: 24px;
  }
}
</style>
