<script setup lang="ts">
import { ElMessage } from "element-plus";
import { reactive } from "vue";
import type {
  SmsActivation,
  SmsRegistrationAccountType
} from "@/api/sms-activation";
import {
  canStartRegistration,
  countdown,
  registrationFailureLabel,
  registrationAccountTypeLabel,
  registrationLabel,
  registrationRunning,
  registrationTag,
  smsStateLabel,
  smsStateTag
} from "../sms-activation-display";

const props = defineProps<{
  rows: SmsActivation[];
  now: number;
  acting: number | null;
  /** 当前租户能否开始自动注册；不能时按钮禁用并提示原因。 */
  registrationEnabled: boolean;
  registrationAccountTypes: SmsRegistrationAccountType[];
  registrationDisabledReason: string;
}>();
const emit = defineEmits<{
  (event: "complete", id: number): void;
  (event: "cancel", id: number): void;
  (
    event: "register",
    id: number,
    accountType: SmsRegistrationAccountType
  ): void;
}>();

const selectedTypes = reactive<Record<number, SmsRegistrationAccountType>>({});
function selectedType(id: number): SmsRegistrationAccountType | undefined {
  const selected = selectedTypes[id];
  return props.registrationAccountTypes.includes(selected)
    ? selected
    : props.registrationAccountTypes[0];
}
function register(id: number): void {
  const type = selectedType(id);
  if (props.registrationEnabled && type !== undefined)
    emit("register", id, type);
}

async function copy(text: string, label: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success(`${label}已复制`);
  } catch {
    ElMessage.warning(`${label}复制失败，请手动选择复制`);
  }
}
</script>

<template>
  <div v-if="rows.length" class="active-cards">
    <el-card
      v-for="row in rows"
      :key="row.id"
      shadow="never"
      class="active-card"
    >
      <div class="card-head">
        <el-tag :type="smsStateTag(row.state)">{{
          smsStateLabel(row.state)
        }}</el-tag>
        <span v-if="row.state === 'WAITING_CODE'" class="card-expire">
          {{
            countdown(row.expiresAt, now)
              ? `剩余 ${countdown(row.expiresAt, now)}`
              : "即将过期"
          }}
        </span>
      </div>
      <div class="card-line">
        <span class="card-label">号码</span>
        <span class="card-phone">+{{ row.phoneNumber }}</span>
        <el-button link type="primary" @click="copy(row.phoneNumber, '号码')"
          >复制</el-button
        >
      </div>
      <div class="card-line">
        <span class="card-label">验证码</span>
        <template v-if="row.smsCode">
          <span class="card-code">{{ row.smsCode }}</span>
          <el-button link type="primary" @click="copy(row.smsCode, '验证码')"
            >复制</el-button
          >
        </template>
        <span v-else class="card-waiting">等待短信…</span>
      </div>
      <div v-if="row.registrationState" class="card-line">
        <span class="card-label">注册</span>
        <span>{{
          registrationAccountTypeLabel(row.registrationAccountType)
        }}</span>
        <el-tag :type="registrationTag(row.registrationState)" size="small">{{
          registrationLabel(row.registrationState)
        }}</el-tag>
        <span v-if="row.registrationFailure" class="card-failure">{{
          registrationFailureLabel(row.registrationFailure)
        }}</span>
      </div>
      <div v-if="canStartRegistration(row)" class="card-line">
        <span class="card-label">类型</span>
        <el-select
          :model-value="selectedType(row.id)"
          aria-label="注册账号类型"
          placeholder="暂无可用类型"
          :disabled="!registrationEnabled || acting === row.id"
          @update:model-value="selectedTypes[row.id] = $event"
        >
          <el-option
            v-for="type in registrationAccountTypes"
            :key="type"
            :value="type"
            :label="registrationAccountTypeLabel(type)"
          />
        </el-select>
      </div>
      <div class="card-actions">
        <el-tooltip
          v-if="canStartRegistration(row)"
          :disabled="registrationEnabled"
          :content="`自动注册未开放：${registrationDisabledReason}`"
          placement="top"
        >
          <span>
            <el-button
              type="success"
              size="small"
              :loading="acting === row.id"
              :disabled="
                !registrationEnabled || selectedType(row.id) === undefined
              "
              @click="register(row.id)"
              >开始注册</el-button
            >
          </span>
        </el-tooltip>
        <el-button
          v-if="row.state === 'RECEIVED' && !registrationRunning(row)"
          type="primary"
          size="small"
          :loading="acting === row.id"
          @click="emit('complete', row.id)"
          >完成</el-button
        >
        <el-button
          v-if="row.state === 'WAITING_CODE' && !registrationRunning(row)"
          size="small"
          :loading="acting === row.id"
          :disabled="Boolean(countdown(row.cancelAfter, now))"
          @click="emit('cancel', row.id)"
          >{{
            countdown(row.cancelAfter, now)
              ? `${countdown(row.cancelAfter, now)} 后可取消`
              : "取消"
          }}</el-button
        >
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.active-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.card-expire,
.card-label,
.card-waiting {
  color: var(--el-text-color-secondary);
}

.card-line {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.card-label {
  width: 48px;
}

.card-phone {
  font-size: 16px;
  font-weight: 600;
}

.card-code {
  font-size: 22px;
  font-weight: 700;
  color: var(--el-color-success);
  letter-spacing: 2px;
}

.card-failure {
  color: var(--el-color-danger);
}

.card-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
