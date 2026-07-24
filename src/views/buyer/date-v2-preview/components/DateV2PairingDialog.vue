<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage } from "element-plus";
import { Loading } from "@element-plus/icons-vue";
import type { PublicPromotionPairingStatus } from "@/api/public-promotion-channel";

const props = defineProps<{
  pairingCode: string;
  themeColor: string;
  status: PublicPromotionPairingStatus | "IDLE";
  errorMessage?: string;
}>();

const visible = defineModel<boolean>({ required: true });

const emit = defineEmits<{
  copied: [];
  retry: [];
}>();

const fallbackInput = ref<HTMLInputElement>();
const codeDigits = computed(() =>
  props.pairingCode
    .slice(0, 8)
    .split("")
    .map((digit, position) => ({
      digit,
      position: `pairing-position-${position + 1}`
    }))
);

const isFailed = computed(
  () => props.status === "FAILED" || props.status === "EXPIRED"
);

async function copyPairingCode(): Promise<void> {
  let copied = false;
  if (window.isSecureContext && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(props.pairingCode);
      copied = true;
    } catch {
      copied = false;
    }
  }

  if (!copied && fallbackInput.value) {
    fallbackInput.value.focus();
    fallbackInput.value.select();
    copied = document.execCommand("copy");
  }

  if (copied) {
    ElMessage.success("配对码已复制");
  } else {
    ElMessage.warning("浏览器未允许自动复制，请长按配对码复制");
  }
  emit("copied");
}
</script>

<template>
  <el-dialog
    v-model="visible"
    class="date-v2-pairing-dialog"
    :style="{ '--date-theme': themeColor }"
    width="min(480px, calc(100vw - 28px))"
    append-to-body
    align-center
    :show-close="false"
    :close-on-click-modal="false"
  >
    <section class="pairing-panel">
      <template v-if="status === 'WAITING_CONFIRMATION' && pairingCode">
        <h2>在手机上输入代码</h2>
        <p>关联 WhatsApp 账户</p>

        <div class="pairing-code" aria-label="WhatsApp 配对码">
          <span v-for="item in codeDigits" :key="item.position">
            {{ item.digit }}
          </span>
        </div>
      </template>

      <div v-else class="pairing-state">
        <el-icon v-if="!isFailed" class="is-loading" :size="44">
          <Loading />
        </el-icon>
        <h2>
          {{
            status === "FINALIZING"
              ? "正在登录"
              : isFailed
                ? status === "EXPIRED"
                  ? "配对码已过期"
                  : "配对失败"
                : "正在生成配对码"
          }}
        </h2>
        <p>
          {{
            isFailed
              ? errorMessage || "请重新发起配对"
              : status === "FINALIZING"
                ? "关联成功，正在初始化账号"
                : "请稍候，不要关闭页面"
          }}
        </p>
      </div>

      <input
        ref="fallbackInput"
        class="pairing-copy-source"
        :value="pairingCode"
        readonly
        tabindex="-1"
        aria-hidden="true"
      />

      <el-button
        v-if="status === 'WAITING_CONFIRMATION' && pairingCode"
        class="pairing-action"
        type="primary"
        @click="copyPairingCode"
      >
        复制到 WHATSAPP
      </el-button>
      <el-button
        v-else-if="isFailed"
        class="pairing-action"
        type="primary"
        @click="emit('retry')"
      >
        重新获取配对码
      </el-button>
    </section>
  </el-dialog>
</template>

<style scoped>
.pairing-panel {
  padding: 34px 20px 28px;
  color: #fff;
  text-align: center;
}

.pairing-panel h2 {
  margin: 0;
  font-size: clamp(26px, 7vw, 34px);
  color: color-mix(in srgb, var(--date-theme) 78%, #fff);
}

.pairing-panel p {
  margin: 12px 0 28px;
  font-size: 17px;
  color: rgb(255 255 255 / 46%);
}

.pairing-state {
  display: grid;
  place-items: center;
  min-height: 250px;
}

.pairing-state .el-icon {
  margin-bottom: 20px;
  color: var(--date-theme);
}

.pairing-code {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 34px;
}

.pairing-code span {
  display: grid;
  place-items: center;
  min-width: 0;
  aspect-ratio: 0.78;
  font-size: clamp(20px, 6vw, 29px);
  font-weight: 900;
  color: #fff;
  background: color-mix(in srgb, var(--date-theme) 16%, #140c10);
  border: 1px solid var(--date-theme);
  border-radius: 9px;
  box-shadow:
    inset 0 0 15px color-mix(in srgb, var(--date-theme) 22%, transparent),
    0 0 15px color-mix(in srgb, var(--date-theme) 18%, transparent);
}

.pairing-copy-source {
  position: fixed;
  top: -1000px;
  left: -1000px;
  opacity: 0;
}

.pairing-action {
  width: 100%;
  min-height: 62px;
  font-size: 19px;
  font-weight: 900;
  letter-spacing: 1px;
  background: linear-gradient(
    100deg,
    color-mix(in srgb, var(--date-theme) 72%, #fff),
    var(--date-theme)
  );
  border: 0;
  border-radius: 999px;
  box-shadow: 0 14px 30px color-mix(in srgb, var(--date-theme) 32%, transparent);
}

:global(.date-v2-pairing-dialog) {
  color: #fff;
  background: rgb(16 14 15 / 97%);
  border: 2px solid color-mix(in srgb, var(--date-theme) 54%, #542d39);
  border-radius: 28px;
  box-shadow: 0 30px 90px rgb(0 0 0 / 74%);
}

:global(.date-v2-pairing-dialog .el-dialog__header) {
  display: none;
}

:global(.date-v2-pairing-dialog .el-dialog__body) {
  padding: 0;
}

@media (width <= 420px) {
  .pairing-panel {
    padding-inline: 14px;
  }

  .pairing-code {
    gap: 4px;
  }
}
</style>
