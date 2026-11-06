<script setup lang="ts">
import { computed, ref } from "vue";
import type { TenantAccount } from "@/api/account";
import { MESSAGE_CAP_MAX_ACCOUNTS } from "@/api/account-message-cap";
import { useMessageCap } from "../composables/useMessageCap";
import {
  QUERY_STATUS_META,
  enumLabel,
  formatCycle,
  formatEpochSeconds,
  formatQuota,
  formatRemaining,
  formatSubscription,
  queryStatusNote,
  rawJsonText,
  resultStatusLabel
} from "../message-cap-display";

const visible = ref(false);
const accountIds = ref<number[]>([]);
const { rows, loading, error, queriedAt, query, reset } = useMessageCap();

const succeeded = computed(
  () => rows.value.filter(row => row.queryStatus === "SUCCESS").length
);
const queriedAtText = computed(() =>
  queriedAt.value
    ? formatEpochSeconds(String(Math.floor(queriedAt.value / 1000)))
    : ""
);

/** 每次打开冻结当前勾选的账号并立即查询；后端按租户校验账号归属。 */
function open(selection: TenantAccount[]) {
  accountIds.value = selection
    .map(row => row.id)
    .filter((id): id is number => id !== undefined);
  visible.value = true;
  void query(accountIds.value);
}

defineExpose({ open });
</script>

<template>
  <el-drawer
    v-model="visible"
    title="新聊天额度"
    size="1080px"
    destroy-on-close
    @closed="reset"
  >
    <el-alert type="info" :closable="false" show-icon>
      <template #title>
        新聊天额度是 WhatsApp
        对“向尚未聊过的新联系人发起首条消息”设定的周期额度，不等于账号的全部发送能力。额度为
        -1
        是平台特殊值，不代表无限；剩余额度仅在总额度与已用额度都有效时才会计算。
      </template>
    </el-alert>
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      show-icon
      :closable="false"
      class="cap-gap"
    />
    <div class="cap-actions">
      <span>
        已选 {{ accountIds.length }} 个账号，成功 {{ succeeded }} 个，未获得额度
        {{ rows.length - succeeded }} 个
        <template v-if="accountIds.length > MESSAGE_CAP_MAX_ACCOUNTS"
          >（超过 {{ MESSAGE_CAP_MAX_ACCOUNTS }} 个将自动分批）</template
        >
        <template v-if="queriedAtText">
          · 查询时间 {{ queriedAtText }}</template
        >
      </span>
      <el-button :loading="loading" @click="query(accountIds)"
        >重新查询</el-button
      >
    </div>
    <el-table v-loading="loading" :data="rows" row-key="accountId" border>
      <el-table-column type="expand" width="44">
        <template #default="{ row }">
          <div class="cap-expand">
            <el-descriptions :column="3" border size="small">
              <el-descriptions-item label="响应完整度">{{
                resultStatusLabel(row.cap?.resultStatus)
              }}</el-descriptions-item>
              <el-descriptions-item label="平台下发时间">{{
                formatEpochSeconds(row.cap?.serverSentTimestamp)
              }}</el-descriptions-item>
              <el-descriptions-item label="协议层查询时间">{{
                row.cap?.fetchedAt ?? "—"
              }}</el-descriptions-item>
            </el-descriptions>
            <p class="cap-raw-title">原始数据（便于核对每个字段）</p>
            <pre class="cap-raw">{{ rawJsonText(row) }}</pre>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="账号" min-width="140">
        <template #default="{ row }">{{
          row.phone ?? `账号 #${row.accountId}`
        }}</template>
      </el-table-column>
      <el-table-column label="查询结果" min-width="150">
        <template #default="{ row }">
          <el-tag :type="QUERY_STATUS_META[row.queryStatus].type">{{
            QUERY_STATUS_META[row.queryStatus].label
          }}</el-tag>
          <span v-if="queryStatusNote(row)" class="cap-note">{{
            queryStatusNote(row)
          }}</span>
        </template>
      </el-table-column>
      <el-table-column label="总额度" min-width="130">
        <template #default="{ row }">{{
          formatQuota(row.cap?.totalQuota)
        }}</template>
      </el-table-column>
      <el-table-column label="已用" min-width="80">
        <template #default="{ row }">{{
          formatQuota(row.cap?.usedQuota)
        }}</template>
      </el-table-column>
      <el-table-column label="剩余" min-width="80">
        <template #default="{ row }">{{ formatRemaining(row.cap) }}</template>
      </el-table-column>
      <el-table-column label="限制状态" min-width="150">
        <template #default="{ row }">{{
          enumLabel("cappingStatus", row.cap?.cappingStatus)
        }}</template>
      </el-table-column>
      <el-table-column label="统计周期" min-width="290">
        <template #default="{ row }">{{ formatCycle(row.cap) }}</template>
      </el-table-column>
      <el-table-column label="一次性豁免" min-width="170">
        <template #default="{ row }">{{
          enumLabel("oteStatus", row.cap?.oteStatus)
        }}</template>
      </el-table-column>
      <el-table-column label="Meta Verified" min-width="170">
        <template #default="{ row }">{{
          enumLabel("mvStatus", row.cap?.mvStatus)
        }}</template>
      </el-table-column>
      <el-table-column label="订阅" min-width="170">
        <template #default="{ row }">{{
          formatSubscription(row.cap)
        }}</template>
      </el-table-column>
    </el-table>
  </el-drawer>
</template>

<style scoped>
.cap-gap {
  margin-top: 12px;
}

.cap-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 12px 0;
}

.cap-note {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.cap-expand {
  padding: 8px 16px;
}

.cap-raw-title {
  margin: 12px 0 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.cap-raw {
  max-height: 280px;
  padding: 8px 12px;
  margin: 0;
  overflow: auto;
  font-size: 12px;
  word-break: break-all;
  white-space: pre-wrap;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}
</style>
