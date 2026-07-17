<script setup lang="ts">
import type {
  HistoricalGroupItem,
  HistoricalGroupMembershipState,
  HistoricalGroupSelfRole,
  HistoricalGroupSpeechState
} from "@/api/historical-group";
import type { HistoricalGroupSection } from "../composables/useHistoricalGroupPage";

defineOptions({
  name: "HistoricalGroupTable"
});

defineProps<{
  loading: boolean;
  sections: HistoricalGroupSection[];
  selectedAccountId: number | null;
}>();

const emit = defineEmits<{
  (event: "open-detail", row: HistoricalGroupItem): void;
}>();

type TagType = "primary" | "success" | "warning" | "info" | "danger";

const membershipMeta: Record<
  HistoricalGroupMembershipState,
  { label: string; type: TagType }
> = {
  CURRENT_IN_GROUP: { label: "在群", type: "success" },
  CURRENT_NOT_IN_GROUP: { label: "已退出", type: "info" },
  UNVERIFIED: { label: "未校验", type: "warning" },
  FETCH_FAILED: { label: "获取失败", type: "danger" }
};

const speechLabels: Record<HistoricalGroupSpeechState, string> = {
  NORMAL: "正常发言",
  ADMIN_CAN_SPEAK: "管理员可发言",
  CANNOT_SPEAK: "禁止发言",
  ABNORMAL: "状态异常"
};

const roleLabels: Record<HistoricalGroupSelfRole, string> = {
  OWNER: "群主",
  ADMIN: "管理员",
  MEMBER: "普通成员"
};

function speechLabel(value: HistoricalGroupSpeechState | null): string {
  return value ? speechLabels[value] : "-";
}

function roleLabel(value: HistoricalGroupSelfRole | null): string {
  return value ? roleLabels[value] : "-";
}

function openDetail(row: unknown): void {
  if (!row || typeof row !== "object" || !("groupJid" in row)) return;
  emit("open-detail", row as HistoricalGroupItem);
}
</script>

<template>
  <div v-loading="loading" class="historical-group-table">
    <el-empty
      v-if="!selectedAccountId"
      description="请先选择账号分组和操作账号"
    />
    <el-empty
      v-else-if="sections.length === 0 && !loading"
      description="该账号没有 baseline 历史群"
    />
    <template v-else>
      <el-card
        v-for="section in sections"
        :key="section.key"
        shadow="never"
        class="historical-group-section"
      >
        <template #header>
          <div class="section-header">
            <strong>{{ section.title }}</strong>
            <el-tag type="info">{{ section.rows.length }}</el-tag>
          </div>
        </template>

        <el-table :data="section.rows" row-key="groupJid">
          <el-table-column label="群名称" min-width="180">
            <template #default="{ row }">
              <span>{{ row.subject || "-" }}</span>
            </template>
          </el-table-column>
          <el-table-column label="完整群 JID" min-width="260">
            <template #default="{ row }">
              <span class="full-value">{{ row.groupJid }}</span>
            </template>
          </el-table-column>
          <el-table-column label="当前关系" width="110">
            <template #default="{ row }">
              <el-tag :type="membershipMeta[row.membershipState].type">
                {{ membershipMeta[row.membershipState].label }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="自身角色" width="120">
            <template #default="{ row }">
              {{ roleLabel(row.selfRole) }}
            </template>
          </el-table-column>
          <el-table-column label="发言状态" width="130">
            <template #default="{ row }">
              {{ speechLabel(row.speechState) }}
            </template>
          </el-table-column>
          <el-table-column label="成员数" width="90">
            <template #default="{ row }">
              {{ row.memberSize ?? "-" }}
            </template>
          </el-table-column>
          <el-table-column label="完整错误" min-width="220">
            <template #default="{ row }">
              <span class="full-value error-message">{{
                row.errorMessage || "-"
              }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="110" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDetail(row)">
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>
  </div>
</template>

<style scoped>
.historical-group-section + .historical-group-section {
  margin-top: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.full-value {
  white-space: pre-wrap;
  word-break: break-all;
}

.error-message {
  color: var(--el-color-danger);
}
</style>
