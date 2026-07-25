<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { BuyerChannelRuntimeConfig } from "@/api/buyer-channel";
import {
  normalizeDateV2ThemeColor,
  type DateV2Country
} from "../date-v2-preview/domain/date-v2-preview";
import BasicEarnGuideDialog from "./components/BasicEarnGuideDialog.vue";
import BasicEarnDeviceDetail from "./components/BasicEarnDeviceDetail.vue";
import BasicEarnDevices from "./components/BasicEarnDevices.vue";
import BasicEarnFinalStepDialog from "./components/BasicEarnFinalStepDialog.vue";
import BasicEarnLanding from "./components/BasicEarnLanding.vue";
import BasicEarnLoginDialog from "./components/BasicEarnLoginDialog.vue";
import BasicEarnPairingDialog from "./components/BasicEarnPairingDialog.vue";
import BasicEarnRewardUnlocked from "./components/BasicEarnRewardUnlocked.vue";
import { usePublicPromotionPairing } from "../public-promotion/composables/usePublicPromotionPairing";
import { resolvePublicPromotionCountries } from "../public-promotion/domain/public-promotion-countries";
import {
  createBasicEarnFlowState,
  transitionBasicEarnFlow,
  type BasicEarnFlowAction
} from "./domain/basic-earn-flow";

const props = defineProps<{
  promotionCode: string;
  runtimeConfig: BuyerChannelRuntimeConfig;
}>();

const flow = ref(createBasicEarnFlowState());
const pairingVisible = ref(false);
const guideVisible = ref(false);
const pairing = usePublicPromotionPairing();

const themeColor = computed(() =>
  normalizeDateV2ThemeColor(props.runtimeConfig.themeColor, "#f5a20a")
);

const availableCountries = computed(() => {
  return resolvePublicPromotionCountries(props.runtimeConfig.targetCountry);
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

function dispatch(action: BasicEarnFlowAction): void {
  flow.value = transitionBasicEarnFlow(flow.value, action);
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

function handleLogout(): void {
  pairing.cancel();
  dispatch("CONFIRM_LOGOUT");
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
    dispatch("PAIRING_SUCCEEDED");
  }
});
</script>

<template>
  <main class="basic-earn-preview" :style="{ '--earn-theme': themeColor }">
    <BasicEarnLanding
      v-if="flow.page === 'landing'"
      :show-app-download="runtimeConfig.showAppDownload"
      @claim="flow.loginVisible = true"
    />
    <BasicEarnRewardUnlocked
      v-else-if="flow.page === 'reward-unlocked'"
      :show-app-download="runtimeConfig.showAppDownload"
      @link-another="dispatch('LINK_ANOTHER_ACCOUNT')"
      @manage-devices="dispatch('OPEN_DEVICES')"
    />
    <BasicEarnDevices
      v-else-if="flow.page === 'devices'"
      @back="dispatch('BACK_TO_REWARD')"
      @connect="dispatch('LINK_ANOTHER_ACCOUNT')"
      @select-device="dispatch('OPEN_DEVICE_DETAIL')"
    />
    <BasicEarnDeviceDetail
      v-else
      v-model:logout-confirm-visible="flow.logoutConfirmVisible"
      @back="dispatch('BACK_TO_DEVICES')"
      @confirm-logout="handleLogout"
    />
    <BasicEarnFinalStepDialog
      v-model="flow.finalStepVisible"
      :theme-color="themeColor"
      @continue="dispatch('OPEN_REWARD')"
    />
    <BasicEarnLoginDialog
      v-model="flow.loginVisible"
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
