<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { getPublicPromotionChannelRuntime } from "@/api/public-promotion-channel";
import type { BuyerChannelRuntimeConfig } from "@/api/buyer-channel";
import {
  dateV2MockCountries,
  dateV2MockProfiles
} from "../../../../mock/date-v2-preview";
import DateV2Chat from "./components/DateV2Chat.vue";
import DateV2Landing from "./components/DateV2Landing.vue";
import DateV2LoginDialog from "./components/DateV2LoginDialog.vue";
import DateV2PairingDialog from "./components/DateV2PairingDialog.vue";
import DateV2WhatsAppGuideDialog from "./components/DateV2WhatsAppGuideDialog.vue";
import {
  normalizeDateV2ThemeColor,
  resolveDateV2PromotionCode,
  type DateV2Country
} from "./domain/date-v2-preview";

const props = withDefaults(
  defineProps<{
    promotionCode?: string;
    requirePromotionCode?: boolean;
  }>(),
  {
    promotionCode: "",
    requirePromotionCode: false
  }
);

const stage = ref<"landing" | "chat">("landing");
const loginVisible = ref(false);
const pairingVisible = ref(false);
const guideVisible = ref(false);
const pairingCode = ref("11111111");
const loggedCountry = ref<DateV2Country>(dateV2MockCountries[0]);
const loggedPhone = ref("");
const runtimeConfig = ref<BuyerChannelRuntimeConfig>();
const runtimeLoading = ref(false);
const runtimeError = ref("");
let runtimeRequestVersion = 0;
const dateV2TemplateCodes = new Set(["base_sex2", "DATE_V2"]);

function locationQueryValue(key: string): string {
  return new URLSearchParams(window.location.search).get(key)?.trim() ?? "";
}

const promotionCode = computed(
  () =>
    props.promotionCode.trim() || resolveDateV2PromotionCode(window.location)
);

const themeColor = computed(() =>
  normalizeDateV2ThemeColor(
    runtimeConfig.value?.themeColor ?? locationQueryValue("themeColor")
  )
);

const showAppDownload = computed(() => {
  if (runtimeConfig.value) return runtimeConfig.value.showAppDownload;
  return locationQueryValue("showAppDownload").toLowerCase() === "true";
});

const availableCountries = computed(() => {
  const targetCountry = runtimeConfig.value?.targetCountry;
  if (!targetCountry || targetCountry === "MIXED") return dateV2MockCountries;
  const country = dateV2MockCountries.find(
    item => item.code === targetCountry.toUpperCase()
  );
  return country ? [country] : dateV2MockCountries;
});

const initialCountryCode = computed(() => {
  const requested =
    runtimeConfig.value?.preselectedCountry ?? locationQueryValue("country");
  const normalized = requested?.toUpperCase() ?? "US";
  return availableCountries.value.some(country => country.code === normalized)
    ? normalized
    : (availableCountries.value[0]?.code ?? "US");
});

watch(
  promotionCode,
  async code => {
    const requestVersion = ++runtimeRequestVersion;
    runtimeConfig.value = undefined;
    runtimeError.value = "";
    if (!code) {
      if (props.requirePromotionCode) {
        runtimeError.value = "推广链接格式不正确";
      }
      return;
    }
    runtimeLoading.value = true;
    try {
      const result = await getPublicPromotionChannelRuntime(code);
      if (requestVersion !== runtimeRequestVersion) return;
      if (!dateV2TemplateCodes.has(result.templateCode)) {
        throw new Error("推广链接绑定的不是约会二代模板");
      }
      runtimeConfig.value = result;
    } catch (error) {
      if (requestVersion !== runtimeRequestVersion) return;
      runtimeError.value =
        error instanceof Error ? error.message : "推广链接不存在或已失效";
    } finally {
      if (requestVersion === runtimeRequestVersion) {
        runtimeLoading.value = false;
      }
    }
  },
  { immediate: true }
);

function handleLogin(payload: { country: DateV2Country; phone: string }): void {
  loggedCountry.value = payload.country;
  loggedPhone.value = payload.phone;
  pairingVisible.value = true;
}

function handlePairingCopied(): void {
  pairingVisible.value = false;
  guideVisible.value = true;
}
</script>

<template>
  <main class="date-v2-preview" :style="{ '--date-theme': themeColor }">
    <div v-if="runtimeLoading" class="runtime-state">
      <el-skeleton :rows="8" animated />
    </div>
    <el-result
      v-else-if="runtimeError"
      icon="error"
      title="推广链接不可用"
      :sub-title="runtimeError"
    />
    <DateV2Landing
      v-else-if="stage === 'landing'"
      :profiles="dateV2MockProfiles"
      :show-app-download="showAppDownload"
      @login="loginVisible = true"
    />
    <DateV2Chat
      v-else
      :country="loggedCountry"
      :phone="loggedPhone"
      :profiles="dateV2MockProfiles"
      :theme-color="themeColor"
    />

    <DateV2LoginDialog
      v-model="loginVisible"
      :countries="availableCountries"
      :initial-country-code="initialCountryCode"
      :theme-color="themeColor"
      @login="handleLogin"
    />
    <DateV2PairingDialog
      v-model="pairingVisible"
      :pairing-code="pairingCode"
      :theme-color="themeColor"
      @copied="handlePairingCopied"
    />
    <DateV2WhatsAppGuideDialog
      v-model="guideVisible"
      :pairing-code="pairingCode"
      :theme-color="themeColor"
    />
  </main>
</template>

<style scoped>
.date-v2-preview {
  min-width: 320px;
  min-height: 100vh;
  color-scheme: dark;
  background: #090709;
}

.runtime-state {
  width: min(100%, 520px);
  min-height: 100vh;
  padding: 28px 20px;
  margin: 0 auto;
  background: #fff;
}
</style>
