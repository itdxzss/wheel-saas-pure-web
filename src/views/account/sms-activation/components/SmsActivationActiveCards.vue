<script setup lang="ts">
import { ElMessage } from "element-plus";
import type { SmsActivation } from "@/api/sms-activation";
import {
  countdown,
  smsStateLabel,
  smsStateTag
} from "../sms-activation-display";

defineProps<{
  rows: SmsActivation[];
  now: number;
  acting: number | null;
}>();
const emit = defineEmits<{
  (event: "complete", id: number): void;
  (event: "cancel", id: number): void;
}>();

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
      <div class="card-actions">
        <el-button
          v-if="row.state === 'RECEIVED'"
          type="primary"
          size="small"
          :loading="acting === row.id"
          @click="emit('complete', row.id)"
          >完成</el-button
        >
        <el-button
          v-if="row.state === 'WAITING_CODE'"
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

.card-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
