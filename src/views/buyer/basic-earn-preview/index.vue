<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { BuyerChannelRuntimeConfig } from "@/api/buyer-channel";
import { dateV2MockCountries } from "../../../../mock/date-v2-preview";
import {
  normalizeDateV2ThemeColor,
  type DateV2Country
} from "../date-v2-preview/domain/date-v2-preview";
import BasicEarnGuideDialog from "./components/BasicEarnGuideDialog.vue";
import BasicEarnLanding from "./components/BasicEarnLanding.vue";
import BasicEarnLoginDialog from "./components/BasicEarnLoginDialog.vue";
import BasicEarnPairingDialog from "./components/BasicEarnPairingDialog.vue";
import { usePublicPromotionPairing } from "../public-promotion/composables/usePublicPromotionPairing";

const props = defineProps<{
  promotionCode: string;
  runtimeConfig: BuyerChannelRuntimeConfig;
}>();

const loginVisible = ref(false);
const pairingVisible = ref(false);
const guideVisible = ref(false);
const pairing = usePublicPromotionPairing();

const themeColor = computed(() =>
  normalizeDateV2ThemeColor(props.runtimeConfig.themeColor, "#f5a20a")
);

const availableCountries = computed(() => {
  const targetCountry = props.runtimeConfig.targetCountry?.toUpperCase();
  if (!targetCountry || targetCountry === "MIXED") return dateV2MockCountries;
  const country = dateV2MockCountries.find(item => item.code === targetCountry);
  return country ? [country] : dateV2MockCountries;
});

const initialCountryCode = computed(() => {
  const requested = props.runtimeConfig.preselectedCountry?.toUpperCase();
  if (
    requested &&
    availableCountries.value.some(country => country.code === requested)
  ) {
    return requested;
  }
  return availableCountries.value[0]?.code ?? "US";
});

function handleLogin(payload: { country: DateV2Country; phone: string }): void {
  guideVisible.value = false;
  pairingVisible.value = true;
  void pairing.start({
    channelCode: props.promotionCode,
    dialCode: payload.country.dialCode,
    phone: payload.phone
  });
}

function handlePairingCopied(): void {
  if (pairing.status.value !== "WAITING_CONFIRMATION") return;
  pairingVisible.value = false;
  guideVisible.value = true;
}

function handleResend(): void {
  guideVisible.value = false;
  pairingVisible.value = true;
  void pairing.retry();
}

watch(pairing.status, currentStatus => {
  if (
    currentStatus === "FINALIZING" ||
    currentStatus === "FAILED" ||
    currentStatus === "EXPIRED"
  ) {
    guideVisible.value = false;
    pairingVisible.value = true;
    return;
  }
  if (currentStatus === "SUCCEEDED") {
    pairingVisible.value = false;
    guideVisible.value = false;
    ElMessage.success("WhatsApp 登录成功，奖励已解锁");
  }
});
</script>

<template>
  <main class="basic-earn-preview" :style="{ '--earn-theme': themeColor }">
    <BasicEarnLanding
      :show-app-download="runtimeConfig.showAppDownload"
      @claim="loginVisible = true"
    />
    <BasicEarnLoginDialog
      v-model="loginVisible"
      :countries="availableCountries"
      :initial-country-code="initialCountryCode"
      :theme-color="themeColor"
      @login="handleLogin"
    />
    <BasicEarnPairingDialog
      v-model="pairingVisible"
      :pairing-code="pairing.pairingCode.value"
      :theme-color="themeColor"
      :status="pairing.status.value"
      :error-message="pairing.errorMessage.value"
      @copied="handlePairingCopied"
      @retry="handleResend"
    />
    <BasicEarnGuideDialog
      v-model="guideVisible"
      :pairing-code="pairing.pairingCode.value"
      :theme-color="themeColor"
      @resend="handleResend"
    />
  </main>
</template>

<style scoped>
.basic-earn-preview {
  min-width: 320px;
  min-height: 100vh;
  color: #241f1a;
  color-scheme: light;
  background: #f8f3ea;
}
</style>
