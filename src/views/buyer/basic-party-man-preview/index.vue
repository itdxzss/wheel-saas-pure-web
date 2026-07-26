<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { BuyerChannelRuntimeConfig } from "@/api/buyer-channel";
import { usePublicPromotionPairing } from "../public-promotion/composables/usePublicPromotionPairing";
import { resolvePublicPromotionCountries } from "../public-promotion/domain/public-promotion-countries";
import DateV2LoginDialog from "../date-v2-preview/components/DateV2LoginDialog.vue";
import DateV2PairingDialog from "../date-v2-preview/components/DateV2PairingDialog.vue";
import DateV2WhatsAppGuideDialog from "../date-v2-preview/components/DateV2WhatsAppGuideDialog.vue";
import {
  normalizeDateV2ThemeColor,
  type DateV2Country
} from "../date-v2-preview/domain/date-v2-preview";
import BasicPartyManAccessDialog from "./components/BasicPartyManAccessDialog.vue";
import BasicPartyManChat from "./components/BasicPartyManChat.vue";
import BasicPartyManLanding from "./components/BasicPartyManLanding.vue";
import BasicPartyManMatchList from "./components/BasicPartyManMatchList.vue";
import BasicPartyManProfile from "./components/BasicPartyManProfile.vue";
import {
  basicPartyManProfiles,
  createBasicPartyManFlowState,
  transitionBasicPartyManFlow,
  type BasicPartyManFlowAction
} from "./domain/basic-party-man";

const props = defineProps<{
  promotionCode: string;
  runtimeConfig: BuyerChannelRuntimeConfig;
}>();

const flow = ref(createBasicPartyManFlowState());
const pairingVisible = ref(false);
const guideVisible = ref(false);
const pairing = usePublicPromotionPairing();

const themeColor = computed(() =>
  normalizeDateV2ThemeColor(props.runtimeConfig.themeColor, "#ec3f6d")
);
const availableCountries = computed(() =>
  resolvePublicPromotionCountries(props.runtimeConfig.targetCountry)
);
const initialCountryCode = computed(() => {
  const requested = props.runtimeConfig.preselectedCountry;
  return availableCountries.value.some(country => country.code === requested)
    ? requested
    : (availableCountries.value[0]?.code ?? "US");
});
const selectedProfile = computed(
  () =>
    basicPartyManProfiles.find(
      profile => profile.id === flow.value.selectedProfileId
    ) ?? basicPartyManProfiles[0]
);

function dispatch(action: BasicPartyManFlowAction): void {
  flow.value = transitionBasicPartyManFlow(flow.value, action);
}

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

function resetFlow(): void {
  pairing.cancel();
  pairingVisible.value = false;
  guideVisible.value = false;
  dispatch("RESET");
}

watch(pairing.status, status => {
  if (status === "FINALIZING" || status === "FAILED" || status === "EXPIRED") {
    guideVisible.value = false;
    pairingVisible.value = true;
  }
  if (status === "SUCCEEDED") {
    guideVisible.value = false;
    pairingVisible.value = false;
    dispatch("PAIRING_SUCCEEDED");
  }
});
</script>

<template>
  <main class="basic-party-man-app" :style="{ '--party-theme': themeColor }">
    <BasicPartyManLanding
      v-if="flow.page === 'landing'"
      :show-app-download="runtimeConfig.showAppDownload"
      @request-access="dispatch('REQUEST_ACCESS')"
    />
    <BasicPartyManMatchList
      v-else-if="flow.page === 'matches'"
      :profiles="basicPartyManProfiles"
      @open-profile="dispatch({ type: 'OPEN_PROFILE', profileId: $event })"
      @cancel="resetFlow"
    />
    <BasicPartyManProfile
      v-else-if="flow.page === 'profile'"
      :profile="selectedProfile"
      @back="dispatch('BACK_TO_MATCHES')"
      @chat="dispatch('OPEN_CHAT')"
    />
    <BasicPartyManChat
      v-else
      :profile="selectedProfile"
      @back="dispatch('BACK_TO_PROFILE')"
    />

    <BasicPartyManAccessDialog
      v-model="flow.accessVisible"
      :theme-color="themeColor"
      @unlock="dispatch('OPEN_LOGIN')"
    />
    <DateV2LoginDialog
      v-model="flow.loginVisible"
      :countries="availableCountries"
      :initial-country-code="initialCountryCode"
      :theme-color="themeColor"
      @login="handleLogin"
    />
    <DateV2PairingDialog
      v-model="pairingVisible"
      :pairing-code="pairing.pairingCode.value"
      :theme-color="themeColor"
      :status="pairing.status.value"
      :error-message="pairing.errorMessage.value"
      @copied="handlePairingCopied"
      @retry="pairing.retry"
    />
    <DateV2WhatsAppGuideDialog
      v-model="guideVisible"
      :pairing-code="pairing.pairingCode.value"
      :theme-color="themeColor"
    />
  </main>
</template>

<style scoped>
.basic-party-man-app {
  min-width: 320px;
  min-height: 100vh;
  background: #080104;
}
</style>
