<script setup lang="ts">
import type {
  HistoricalGroupDetail,
  HistoricalGroupMember,
  HistoricalGroupParticipantActionResult,
  HistoricalGroupSelfRole
} from "@/api/historical-group";
import type { HistoricalGroupParticipantAction } from "../composables/useHistoricalGroupDetail";

defineOptions({
  name: "HistoricalGroupMemberTable"
});

const props = defineProps<{
  actionError: string;
  actionLoading: boolean;
  demoteJids: string[];
  detail: HistoricalGroupDetail;
  disabled: boolean;
  disabledReason: string;
  lastAction: HistoricalGroupParticipantAction | null;
  lastActionResult: HistoricalGroupParticipantActionResult | null;
  promoteJids: string[];
  removeJids: string[];
  selectedJids: string[];
}>();

const emit = defineEmits<{
  (event: "run-action", action: HistoricalGroupParticipantAction): void;
  (event: "select-members", participantJids: string[]): void;
}>();

const roleLabels: Record<HistoricalGroupSelfRole, string> = {
  OWNER: "群主",
  ADMIN: "管理员",
  MEMBER: "普通成员"
};

const actionLabels: Record<HistoricalGroupParticipantAction, string> = {
  promote: "批量提升",
  demote: "批量降级",
  remove: "批量移除"
};

function memberFromRow(row: unknown): HistoricalGroupMember | null {
  if (!row || typeof row !== "object" || !("participantJid" in row)) {
    return null;
  }
  return row as HistoricalGroupMember;
}

function toggleMember(row: unknown, checked: unknown): void {
  const member = memberFromRow(row);
  if (!member || props.disabled || !member.operationAllowed) return;
  const next = new Set(props.selectedJids);
  if (checked === true) next.add(member.participantJid);
  else next.delete(member.participantJid);
  emit("select-members", [...next]);
}

function protectionReason(row: unknown): string {
  const member = memberFromRow(row);
  if (!member) return "-";
  if (member.operationDisabledReason) return member.operationDisabledReason;
  if (member.self) return "不能操作当前账号自身";
  if (member.owner) return "不能操作群主";
  return member.operationAllowed ? "-" : "后端未允许操作该成员";
}
</script>

<template>
  <section class="member-management">
    <div class="member-toolbar">
      <div>
        <strong>成员管理</strong>
        <el-tag type="info">已选 {{ selectedJids.length }}</el-tag>
      </div>
      <el-space wrap>
        <el-button
          type="primary"
          :disabled="disabled || promoteJids.length === 0"
          :loading="actionLoading"
          @click="emit('run-action', 'promote')"
        >
          批量提升（{{ promoteJids.length }}）
        </el-button>
        <el-button
          :disabled="disabled || demoteJids.length === 0"
          :loading="actionLoading"
          @click="emit('run-action', 'demote')"
        >
          批量降级（{{ demoteJids.length }}）
        </el-button>
        <el-button
          type="danger"
          :disabled="disabled || removeJids.length === 0"
          :loading="actionLoading"
          @click="emit('run-action', 'remove')"
        >
          批量移除（{{ removeJids.length }}）
        </el-button>
      </el-space>
    </div>

    <el-alert
      v-if="disabled"
      type="warning"
      :closable="false"
      show-icon
      :title="disabledReason"
    />

    <el-table :data="detail.members" row-key="participantJid">
      <el-table-column label="选择" width="70">
        <template #default="{ row }">
          <el-checkbox
            :model-value="selectedJids.includes(row.participantJid)"
            :disabled="
              disabled ||
              !row.operationAllowed ||
              row.self ||
              row.owner ||
              actionLoading
            "
            @change="toggleMember(row, $event)"
          />
        </template>
      </el-table-column>
      <el-table-column label="完整号码" min-width="150">
        <template #default="{ row }">
          <span class="full-value">{{ row.phone }}</span>
        </template>
      </el-table-column>
      <el-table-column label="完整成员 JID" min-width="260">
        <template #default="{ row }">
          <span class="full-value">{{ row.participantJid }}</span>
        </template>
      </el-table-column>
      <el-table-column label="角色" width="110">
        <template #default="{ row }">
          {{ roleLabels[row.selfRole] }}
        </template>
      </el-table-column>
      <el-table-column label="身份" width="150">
        <template #default="{ row }">
          <el-space wrap>
            <el-tag v-if="row.self" type="primary">当前账号</el-tag>
            <el-tag v-if="row.owner" type="warning">群主</el-tag>
            <el-tag v-if="row.admin && !row.owner" type="success">
              管理员
            </el-tag>
          </el-space>
        </template>
      </el-table-column>
      <el-table-column label="操作保护原因" min-width="240">
        <template #default="{ row }">
          <span class="full-value">{{ protectionReason(row) }}</span>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="actionError || lastActionResult" class="action-result">
      <h4>{{ lastAction ? actionLabels[lastAction] : "成员操作" }}逐项结果</h4>
      <el-alert
        v-if="actionError"
        type="error"
        :closable="false"
        :title="actionError"
      />
      <el-table
        v-if="lastActionResult"
        :data="lastActionResult.results"
        row-key="participantJid"
      >
        <el-table-column label="完整成员 JID" min-width="260">
          <template #default="{ row: result }">
            <span class="full-value">{{ result.participantJid }}</span>
          </template>
        </el-table-column>
        <el-table-column label="结果" width="100">
          <template #default="{ row: result }">
            <el-tag :type="result.success ? 'success' : 'danger'">
              {{ result.success ? "成功" : "失败" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="协议状态" width="110">
          <template #default="{ row: result }">
            {{ result.status || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="完整错误码" min-width="180">
          <template #default="{ row: result }">
            <span class="full-value">{{ result.errorCode || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="完整错误信息" min-width="260">
          <template #default="{ row: result }">
            <span class="full-value">{{ result.errorMessage || "-" }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </section>
</template>

<style scoped>
.member-toolbar,
.member-toolbar > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.member-toolbar {
  margin-bottom: 12px;
}

.action-result {
  margin-top: 20px;
}

.full-value {
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
