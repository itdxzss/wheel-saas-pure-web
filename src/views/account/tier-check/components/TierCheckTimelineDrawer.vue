<script setup lang="ts">
import { onScopeDispose, ref, watch } from "vue";
import {
  getAccountTierHistory,
  type TierCheckAccountHistory
} from "@/api/account-tier-check";
import { apiErrorMessage } from "@/utils/api-error";
import { formatEpochMillis } from "@/utils/time";
import {
  changeTagType,
  changeText,
  checkModeText,
  reasonLabel,
  tierLabel,
  tierTagType,
  userTypeText
} from "../tier-check-display";

const open = defineModel<boolean>({ default: false });
const props = defineProps<{ accountId: number | null }>();

const history = ref<TierCheckAccountHistory | null>(null);
const loading = ref(false);
const error = ref("");
let generation = 0;
onScopeDispose(() => {
  generation++;
});

watch(
  () => [open.value, props.accountId] as const,
  async ([visible, accountId]) => {
    const current = ++generation;
    loading.value = false;
    if (!visible || !accountId) return;
    history.value = null;
    error.value = "";
    loading.value = true;
    try {
      const result = await getAccountTierHistory(accountId);
      if (current === generation) history.value = result;
    } catch (e) {
      if (current === generation)
        error.value = apiErrorMessage(e, "档位时间线加载失败");
    } finally {
      if (current === generation) loading.value = false;
    }
  }
);
</script>

<template>
  <el-drawer
    v-model="open"
    :title="`档位时间线${history ? ' · ' + history.phone : ''}`"
    size="min(100%, 520px)"
    append-to-body
  >
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      show-icon
      :closable="false"
    />
    <div v-loading="loading">
      <template v-if="history">
        <p>
          {{ userTypeText[history.serverUserType ?? ""] ?? "-" }} ·
          {{ history.phoneCountryCode ?? "-" }} · 注册时间
          {{ formatEpochMillis(history.joinDateMs) }}
        </p>
        <el-timeline class="mt-4">
          <el-timeline-item
            v-for="entry in history.entries"
            :key="entry.itemId"
            :timestamp="formatEpochMillis(entry.checkedAt)"
            placement="top"
          >
            <el-tag :type="tierTagType[entry.trustTier ?? ''] ?? 'info'">{{
              entry.trustTier ? tierLabel(entry.trustTier) : "未查到"
            }}</el-tag>
            <el-tag
              class="ml-2"
              size="small"
              :type="changeTagType[entry.tierChange]"
              >{{ changeText[entry.tierChange] }}</el-tag
            >
            <p v-if="entry.prevTrustTier" class="mt-1 text-sm text-gray-500">
              上次 {{ tierLabel(entry.prevTrustTier) }}
            </p>
            <p v-if="entry.reasonCode" class="mt-1 text-sm text-gray-500">
              {{ reasonLabel(entry.reasonCode) }}
            </p>
            <p class="mt-1 text-sm text-gray-500">
              {{ entry.taskName }} · {{ checkModeText[entry.mode] }}
            </p>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-if="!history.entries.length" description="暂无检测记录" />
      </template>
    </div>
  </el-drawer>
</template>
