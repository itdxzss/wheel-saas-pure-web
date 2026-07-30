<script setup lang="ts">
import { computed, watch } from "vue";
import type { HistoricalGroupItem } from "@/api/historical-group";
import HistoricalGroupMemberTable from "./HistoricalGroupMemberTable.vue";
import HistoricalGroupPullPanel from "./HistoricalGroupPullPanel.vue";
import { useHistoricalGroupDetail } from "../composables/useHistoricalGroupDetail";

defineOptions({
  name: "HistoricalGroupDetailDrawer"
});

const props = defineProps<{
  group: HistoricalGroupItem | null;
  modelValue: boolean;
  accountGroupId: number | null;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});
const state = useHistoricalGroupDetail({
  accountGroupId: () => props.accountGroupId,
  group: () => props.group
});
const isAdministrator = computed(
  () =>
    state.detail.value?.selfRole === "OWNER" ||
    state.detail.value?.selfRole === "ADMIN"
);

watch(
  [
    () => props.modelValue,
    () => props.accountGroupId,
    () => props.group?.groupJid
  ],
  ([open]) => {
    if (open) void state.open();
    else state.close();
  },
  { immediate: true }
);
</script>

<template>
  <el-drawer
    v-model="visible"
    size="82%"
    destroy-on-close
    title="历史群详情与成员管理"
  >
    <div v-loading="state.detailLoading.value" class="detail-drawer-content">
      <el-descriptions v-if="state.detail.value" :column="2" border>
        <el-descriptions-item label="群名称" :span="2">
          {{ state.detail.value.subject || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="完整群 JID" :span="2">
          <span class="full-value">{{ state.detail.value.groupJid }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="完整邀请链接" :span="2">
          <el-input
            :model-value="state.detail.value.inviteUrl || ''"
            readonly
            placeholder="后端未返回可用邀请链接"
          />
        </el-descriptions-item>
        <el-descriptions-item label="完整错误码">
          <span class="full-value">{{
            state.detail.value.errorCode || "-"
          }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="完整错误信息">
          <span class="full-value">{{
            state.detail.value.errorMessage || "-"
          }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="成员管理权限原因" :span="2">
          <span class="full-value">{{
            state.detail.value.operationDisabledReason || "-"
          }}</span>
        </el-descriptions-item>
      </el-descriptions>

      <HistoricalGroupMemberTable
        v-if="state.detail.value"
        class="member-table"
        :action-error="state.actionError.value"
        :action-loading="state.actionLoading.value"
        :detail="state.detail.value"
        :disabled="state.memberManagementDisabled.value"
        :disabled-reason="state.memberManagementReason.value"
        :last-action="state.lastAction.value"
        :last-action-result="state.lastActionResult.value"
        :promote-jids="state.eligibleParticipantJids('promote')"
        :selected-jids="state.selectedJids.value"
        @run-action="state.runParticipantAction"
        @select-members="state.selectMembers"
      />

      <HistoricalGroupPullPanel
        v-if="state.detail.value && isAdministrator"
        :active="modelValue"
        :source-account-group-id="accountGroupId"
        :detail="state.detail.value"
      />
    </div>
  </el-drawer>
</template>

<style scoped>
.detail-drawer-content > * + * {
  margin-top: 16px;
}

.member-table {
  margin-top: 20px;
}

.full-value {
  word-break: break-all;
  white-space: pre-wrap;
}
</style>
