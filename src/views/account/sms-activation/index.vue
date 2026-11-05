<script setup lang="ts">
import { onActivated, onDeactivated, onMounted, onUnmounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { apiErrorMessage } from "@/utils/api-error";
import SmsActivationPurchaseBar from "./components/SmsActivationPurchaseBar.vue";
import SmsActivationActiveCards from "./components/SmsActivationActiveCards.vue";
import SmsActivationRecords from "./components/SmsActivationRecords.vue";
import { useSmsActivation } from "./composables/useSmsActivation";

defineOptions({ name: "AccountSmsActivation" });

const visible = ref(false);
onMounted(() => (visible.value = true));
onActivated(() => (visible.value = true));
onDeactivated(() => (visible.value = false));
onUnmounted(() => (visible.value = false));

const {
  form,
  options,
  tiers,
  records,
  active,
  page,
  pageSize,
  total,
  now,
  pricesLoading,
  recordsLoading,
  purchasing,
  acting,
  loadError,
  providerOptions,
  canPurchase,
  loadOptions,
  loadPrices,
  changeCountry,
  refreshRecords,
  purchase,
  complete,
  cancel
} = useSmsActivation(visible);

async function run(
  action: () => Promise<unknown>,
  success: string,
  fallback: string
): Promise<void> {
  try {
    await action();
    ElMessage.success(success);
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, fallback));
  }
}

const onPurchase = () => run(purchase, "取号成功，等待短信", "取号失败");
const onComplete = (id: number) =>
  run(() => complete(id), "已完成", "完成失败");
const onCancel = (id: number) => run(() => cancel(id), "已取消", "取消失败");
</script>

<template>
  <div class="sms-activation-page bg-bg_color">
    <div class="page-head">
      <h2 class="page-title">手动接码</h2>
      <el-button
        @click="
          loadOptions();
          refreshRecords();
        "
        >刷新</el-button
      >
    </div>
    <el-alert
      v-if="loadError"
      :title="loadError"
      type="error"
      :closable="false"
      show-icon
      class="mb-4"
    />
    <el-alert
      v-if="options && !options.purchaseEnabled"
      :title="`当前未开放取号：${options.disabledReason || '未知原因'}`"
      type="warning"
      :closable="false"
      class="mb-4"
    />
    <SmsActivationPurchaseBar
      v-model:form="form"
      :options="options"
      :tiers="tiers"
      :provider-options="providerOptions"
      :prices-loading="pricesLoading"
      :purchasing="purchasing"
      :can-purchase="canPurchase"
      @purchase="onPurchase"
      @country-change="changeCountry"
      @refresh-prices="loadPrices"
    />
    <SmsActivationActiveCards
      :rows="active"
      :now="now"
      :acting="acting"
      @complete="onComplete"
      @cancel="onCancel"
    />
    <SmsActivationRecords
      v-model:page="page"
      v-model:page-size="pageSize"
      :rows="records"
      :total="total"
      :loading="recordsLoading"
      @change="refreshRecords"
    />
  </div>
</template>

<style scoped>
.sms-activation-page {
  padding: 20px;
  margin: 16px;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
}
</style>
