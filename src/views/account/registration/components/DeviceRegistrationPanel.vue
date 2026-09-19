<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import { ElMessageBox } from "element-plus";
import { useDeviceRegistration } from "../composables/useDeviceRegistration";
import {
  canPrepareDeviceReplacement,
  registrationFailureLabel,
  registrationStateLabel
} from "../registration-display";

const props = defineProps<{ active: boolean }>();
const {
  form,
  countries,
  tiers,
  merchants,
  current,
  busy,
  pricesLoading,
  pending,
  error,
  loadPrices,
  refresh,
  prepare,
  start
} = useDeviceRegistration(toRef(props, "active"));
const confirming = ref(false);
const hasNumber = computed(() => Boolean(current.value?.phoneNumber));
const canPrepare = computed(
  () =>
    !current.value ||
    current.value.state === "NOT_STARTED" ||
    canPrepareDeviceReplacement(current.value.state, current.value.failureCode)
);

async function confirmStart(): Promise<void> {
  if (!current.value || busy.value || confirming.value) return;
  const snapshot = { ...current.value },
    device = form.deviceId;
  confirming.value = true;
  try {
    await ElMessageBox.confirm(
      `本次取号 1 个；国家渠道 ${snapshot.countryId}；商家 ${snapshot.providerId || "自动（平台分配）"}；单价 ${snapshot.unitPrice} 美元。取号后由手机接续注册，未取到号码时每隔 5 秒重试，最多 50 次；取到号码后不补购。`,
      "确认取号验证",
      {
        confirmButtonText: "确认取号",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    if (props.active && device === form.deviceId) await start(snapshot);
  } catch (reason) {
    if (reason !== "cancel" && reason !== "close") throw reason;
  } finally {
    confirming.value = false;
  }
}
</script>

<template>
  <el-alert
    title="先保存一笔许可，再明确开始取号；IPA 也可领取同一许可。每笔只购买一个号码。"
    type="info"
    :closable="false"
    class="mb-4"
  />
  <el-alert
    v-if="error"
    :title="error"
    type="error"
    :closable="false"
    class="mb-4"
  />
  <el-form
    label-width="110px"
    class="device-registration-form"
    :disabled="busy || confirming || Boolean(pending)"
  >
    <el-form-item label="手机设备标识">
      <el-input
        v-model.trim="form.deviceId"
        placeholder="从 IPA 注册助手复制设备标识"
        maxlength="36"
      />
      <el-button class="ml-2" @click="refresh">查询当前许可</el-button>
    </el-form-item>
    <el-form-item label="国家渠道">
      <el-select v-model="form.countryId">
        <el-option
          v-for="country in countries"
          :key="country.id"
          :value="country.id"
          :label="country.name"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="单价">
      <el-select
        v-model="form.unitPrice"
        :loading="pricesLoading"
        placeholder="选择实时报价"
      >
        <el-option
          v-for="tier in tiers"
          :key="String(tier.cost)"
          :value="String(tier.cost)"
          :label="`${tier.cost} 美元 · 库存 ${tier.count}`"
          :disabled="tier.count <= 0 || tier.providerIds.length === 0"
        />
      </el-select>
      <el-button class="ml-2" :loading="pricesLoading" @click="loadPrices"
        >刷新报价</el-button
      >
    </el-form-item>
    <el-form-item label="商家码">
      <el-select
        v-model="form.providerId"
        clearable
        filterable
        placeholder="自动（平台分配，不限定商家）"
        @clear="form.providerId = null"
      >
        <el-option
          v-for="merchant in merchants"
          :key="merchant"
          :label="merchant"
          :value="merchant"
        />
      </el-select>
    </el-form-item>
    <p>商家留空时由平台分配，最低价和最高价均为所选单价。</p>
  </el-form>
  <p class="mb-4">
    许可有效期 1
    小时。手机可在同一国家、同一价格档位选择有效商家，取号开始后锁定本次参数。
  </p>
  <el-button
    type="primary"
    :loading="busy"
    :disabled="confirming || (!pending && !canPrepare)"
    @click="prepare"
    >{{ pending ? "重试保存原许可" : "保存本次许可（不取号）" }}</el-button
  >
  <el-button
    :loading="busy"
    :disabled="!form.deviceId || confirming"
    @click="refresh"
    >刷新状态</el-button
  >
  <el-descriptions v-if="current" :column="2" border class="mt-4">
    <el-descriptions-item label="状态">{{
      current.state === "NOT_STARTED"
        ? "待开始"
        : registrationStateLabel(current.state)
    }}</el-descriptions-item>
    <el-descriptions-item label="取号尝试"
      >{{ current.purchaseAttempts ?? 0 }} / 50</el-descriptions-item
    >
    <el-descriptions-item label="商家">{{
      current.providerId || "自动（平台分配，不限定商家）"
    }}</el-descriptions-item>
    <el-descriptions-item label="国家 / 单价"
      >{{ current.countryId }} /
      {{ current.unitPrice }} 美元</el-descriptions-item
    >
    <el-descriptions-item label="成交价">{{
      current.actualCost ?? "尚未返回"
    }}</el-descriptions-item>
    <el-descriptions-item label="号码">{{
      current.phoneNumber || "尚未分配"
    }}</el-descriptions-item>
    <el-descriptions-item label="有效期">{{
      new Date(current.purchaseBefore).toLocaleString()
    }}</el-descriptions-item>
    <el-descriptions-item label="请求编号" :span="2">{{
      current.requestId
    }}</el-descriptions-item>
    <el-descriptions-item v-if="current.failureCode" label="结果" :span="2">{{
      registrationFailureLabel(current.failureCode)
    }}</el-descriptions-item>
  </el-descriptions>
  <el-alert
    v-if="hasNumber && current?.state === 'WAITING_CODE'"
    title="取号成功。请在手机注册助手中接续这笔任务，保持应用前台；尚未完成收码和注册。"
    type="success"
    :closable="false"
    class="mt-4"
  />
  <el-button
    v-if="current?.state === 'NOT_STARTED'"
    type="warning"
    class="mt-4"
    :loading="busy || confirming"
    @click="confirmStart"
    >取号验证（1 个号码）</el-button
  >
</template>

<style scoped>
.device-registration-form {
  max-width: 850px;
}

.el-input {
  max-width: 440px;
}
</style>
