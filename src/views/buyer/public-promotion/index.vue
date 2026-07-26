<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { getPublicPromotionChannelRuntime } from "@/api/public-promotion-channel";
import type { BuyerChannelRuntimeConfig } from "@/api/buyer-channel";
import BasicEarnPreview from "../basic-earn-preview/index.vue";
import DateV2Preview from "../date-v2-preview/index.vue";
import {
  resolvePublicPromotionTemplate,
  type PublicPromotionTemplate
} from "./domain/public-promotion";

const props = defineProps<{
  promotionCode: string;
}>();

const runtimeConfig = ref<BuyerChannelRuntimeConfig>();
const runtimeLoading = ref(false);
const runtimeError = ref("");
let requestVersion = 0;

const template = computed<PublicPromotionTemplate | undefined>(() =>
  runtimeConfig.value
    ? resolvePublicPromotionTemplate(runtimeConfig.value.templateCode)
    : undefined
);

watch(
  () => props.promotionCode,
  async code => {
    const currentVersion = ++requestVersion;
    runtimeConfig.value = undefined;
    runtimeError.value = "";
    if (!code) {
      runtimeError.value = "推广链接格式不正确";
      return;
    }
    runtimeLoading.value = true;
    try {
      const result = await getPublicPromotionChannelRuntime(code);
      if (currentVersion !== requestVersion) return;
      if (!resolvePublicPromotionTemplate(result.templateCode)) {
        throw new Error("当前推广模板暂未开放静态页面");
      }
      runtimeConfig.value = result;
      document.title =
        resolvePublicPromotionTemplate(result.templateCode) === "basic-earn"
          ? "RewardClub"
          : "My love day";
    } catch (error) {
      if (currentVersion !== requestVersion) return;
      runtimeError.value =
        error instanceof Error ? error.message : "推广链接不存在或已失效";
    } finally {
      if (currentVersion === requestVersion) runtimeLoading.value = false;
    }
  },
  { immediate: true }
);
</script>

<template>
  <main class="public-promotion-app">
    <div v-if="runtimeLoading" class="public-runtime-state">
      <el-skeleton :rows="8" animated />
    </div>
    <el-result
      v-else-if="runtimeError"
      icon="error"
      title="推广链接不可用"
      :sub-title="runtimeError"
    />
    <DateV2Preview
      v-else-if="template === 'date-v2' && runtimeConfig"
      :promotion-code="promotionCode"
      :runtime-config="runtimeConfig"
      require-promotion-code
    />
    <BasicEarnPreview
      v-else-if="template === 'basic-earn' && runtimeConfig"
      :promotion-code="promotionCode"
      :runtime-config="runtimeConfig"
    />
  </main>
</template>

<style scoped>
.public-promotion-app {
  min-width: 320px;
  min-height: 100vh;
}

.public-runtime-state {
  width: min(100%, 520px);
  min-height: 100vh;
  padding: 28px 20px;
  margin: 0 auto;
  background: #fff;
}
</style>
