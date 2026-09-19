<script setup lang="ts">
import { ref, toRef } from "vue";
import { ElMessageBox } from "element-plus";
import {
  useCloudRegistration,
  type CloudRegistrationRow
} from "../composables/useCloudRegistration";
import { registrationStateLabel } from "../registration-display";

const props = defineProps<{ active: boolean }>();
const {
  rows,
  selected,
  form,
  tiers,
  merchants,
  busy,
  loading,
  pricesLoading,
  error,
  pending,
  canQueue,
  total,
  eligible,
  queue,
  loadDevices,
  loadPrices,
  refresh
} = useCloudRegistration(toRef(props, "active"));
const confirming = ref(false);
function selectionChanged(value: CloudRegistrationRow[]): void {
  selected.value = value.map(row => row.deviceId);
}
function selectable(row: CloudRegistrationRow): boolean {
  return !busy.value && !confirming.value && !pending.value && eligible(row);
}
async function confirmQueue(): Promise<void> {
  if (!canQueue.value || confirming.value) return;
  if (pending.value) {
    await queue();
    return;
  }
  const draft = JSON.stringify([selected.value, form]);
  const names = rows.value
    .filter(r => selected.value.includes(r.deviceId))
    .map(r => r.displayName)
    .join("、");
  confirming.value = true;
  try {
    await ElMessageBox.confirm(
      `已选择 ${selected.value.length} 台：${names}。每台最多一个号码，单台报价 ${form.unitPrice}，本批合计上限 ${total}（供应商计费币种，请先核对）。各台执行器确认手机就绪后取号，取得号码后不补购。`,
      "确认批量自动注册",
      {
        confirmButtonText: "确认排队",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    if (props.active && draft === JSON.stringify([selected.value, form]))
      await queue();
  } catch (reason) {
    if (reason !== "cancel" && reason !== "close") throw reason;
  } finally {
    confirming.value = false;
  }
}
function stateLabel(row: CloudRegistrationRow): string {
  if (row.pending) return "提交未确认，保留原请求";
  if (!row.checked) return "任务状态待确认";
  if (!row.current) return "可选择";
  if (row.current.state === "NOT_STARTED") return "等待执行器确认手机就绪";
  return registrationStateLabel(row.current.state);
}
</script>

<template>
  <el-alert
    title="可多选本租户已绑定的云手机。每台需启动官方 WhatsApp 并进入空白手机号页，由本机执行器分别确认后取号。"
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
  <el-button
    :loading="loading"
    :disabled="busy || confirming || pending"
    @click="loadDevices"
    >刷新云手机列表</el-button
  >
  <el-button :disabled="busy || confirming" @click="refresh"
    >刷新任务状态</el-button
  >
  <el-table
    v-loading="loading"
    :data="rows"
    row-key="deviceId"
    class="my-4"
    empty-text="本租户尚未绑定云手机，请先批量配置设备身份"
    @selection-change="selectionChanged"
  >
    <el-table-column type="selection" :selectable="selectable" width="45" />
    <el-table-column prop="displayName" label="云手机" width="120" />
    <el-table-column prop="cloudPhoneId" label="云手机标识" min-width="180" />
    <el-table-column label="任务状态" min-width="220"
      ><template #default="{ row }">{{
        stateLabel(row)
      }}</template></el-table-column
    >
    <el-table-column label="号码" min-width="160"
      ><template #default="{ row }">{{
        row.current?.phoneNumber || "—"
      }}</template></el-table-column
    >
    <el-table-column label="成交价 / 币种" min-width="140"
      ><template #default="{ row }"
        >{{ row.current?.actualCost ?? "—" }} /
        {{ row.current?.currency ?? "—" }}</template
      ></el-table-column
    >
    <el-table-column label="请求编号" min-width="300"
      ><template #default="{ row }">{{
        row.pending?.requestId || row.current?.requestId || "—"
      }}</template></el-table-column
    >
    <el-table-column label="提示" min-width="200"
      ><template #default="{ row }">{{
        row.error || row.current?.failureCode || "—"
      }}</template></el-table-column
    >
  </el-table>
  <el-form
    label-width="120px"
    :disabled="busy || confirming || pending"
    class="cloud-registration-form"
  >
    <el-form-item label="国家渠道">美国（187），区号 +1</el-form-item>
    <el-form-item label="单台报价">
      <el-select
        v-model="form.unitPrice"
        :loading="pricesLoading"
        placeholder="选择当前报价"
      >
        <el-option
          v-for="tier in tiers"
          :key="String(tier.cost)"
          :value="String(tier.cost)"
          :label="`${tier.cost} · 库存 ${tier.count}`"
          :disabled="tier.count <= 0"
        />
      </el-select>
      <el-button class="ml-2" :loading="pricesLoading" @click="loadPrices"
        >刷新报价</el-button
      >
    </el-form-item>
    <el-form-item label="商家">
      <el-select
        v-model="form.providerId"
        clearable
        filterable
        placeholder="平台自动分配"
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
    <el-form-item label="本批上限"
      >{{ total }} · 已选择 {{ selected.length }} 台，每台一个号码</el-form-item
    >
  </el-form>
  <el-button
    type="primary"
    :loading="busy"
    :disabled="!canQueue || confirming"
    @click="confirmQueue"
    >{{
      pending ? "重试未确认的原请求" : `开始自动注册（${selected.length} 台）`
    }}</el-button
  >
  <p class="mt-4">
    每台许可有效期 1 小时，执行器按并发上限处理。未取得号码时 Armada 最多尝试 50
    次，取得后不补购。条款、权限及额外验证需人工处理。本页显示服务端任务状态，不表示手机或执行器在线；遇到人工处理提示时请检查对应手机。
  </p>
</template>
<style scoped>
.cloud-registration-form {
  max-width: 850px;
}
</style>
