<script setup lang="ts">
import type { SmsActivationOptions } from "@/api/sms-activation";
import type {
  AccountRegistrationPriceTier,
  RegistrationCountry
} from "@/api/account-registration";
import type { SmsActivationDraft } from "../composables/useSmsActivation";

defineProps<{
  options: SmsActivationOptions | null;
  tiers: AccountRegistrationPriceTier[];
  providerOptions: string[];
  pricesLoading: boolean;
  purchasing: boolean;
  canPurchase: boolean;
}>();
const form = defineModel<SmsActivationDraft>("form", { required: true });
const emit = defineEmits<{
  (event: "purchase"): void;
  (event: "country-change"): void;
  (event: "refresh-prices"): void;
}>();

/** 国家名 + 库存 + 供应商报价；库存未知时只显示国家名。 */
function countryLabel(country: RegistrationCountry): string {
  if (country.stock == null) return country.name;
  const price = country.price == null ? "" : ` · ${country.price} 美元起`;
  return `${country.name} · 库存 ${country.stock}${price}`;
}

function changePrice(): void {
  form.value.providerId = null;
}
</script>

<template>
  <div class="purchase-bar">
    <div class="purchase-balance">
      余额：<strong>{{ options?.balance ?? "-" }}</strong>
    </div>
    <el-select
      v-model="form.countryId"
      filterable
      placeholder="国家渠道（可搜索）"
      class="purchase-country"
      @change="emit('country-change')"
    >
      <el-option
        v-for="country in options?.countries ?? []"
        :key="country.id"
        :label="countryLabel(country)"
        :value="country.id"
        :disabled="country.stock === 0"
      />
    </el-select>
    <el-select
      v-model="form.maxPrice"
      :loading="pricesLoading"
      placeholder="价格档位"
      class="purchase-price"
      @change="changePrice"
    >
      <el-option
        v-for="tier in tiers"
        :key="String(tier.cost)"
        :value="String(tier.cost)"
        :disabled="tier.count <= 0"
        :label="`${tier.cost} 美元/个 · 库存 ${tier.count}`"
      />
    </el-select>
    <el-select
      v-model="form.providerId"
      clearable
      placeholder="商家（默认自动）"
      class="purchase-provider"
      @clear="form.providerId = null"
    >
      <el-option
        v-for="provider in providerOptions"
        :key="provider"
        :label="provider"
        :value="provider"
      />
    </el-select>
    <el-button
      :loading="pricesLoading"
      :disabled="!form.countryId"
      @click="emit('refresh-prices')"
      >刷新价格</el-button
    >
    <el-button
      type="primary"
      :loading="purchasing"
      :disabled="!canPurchase"
      @click="emit('purchase')"
      >取号</el-button
    >
  </div>
</template>

<style scoped>
.purchase-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.purchase-balance {
  min-width: 120px;
}

.purchase-provider {
  width: 180px;
}

.purchase-country {
  width: 300px;
}

.purchase-price {
  width: 240px;
}
</style>
