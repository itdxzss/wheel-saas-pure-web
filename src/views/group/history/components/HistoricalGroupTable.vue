<script setup lang="ts">
import dayjs from "dayjs";
import type {
  HistoricalGroupItem,
  HistoricalGroupMembershipState,
  HistoricalGroupSelfRole,
  HistoricalGroupSpeechState
} from "@/api/historical-group";

defineOptions({
  name: "HistoricalGroupTable"
});

defineProps<{
  accountGroupSelected: boolean;
  loading: boolean;
  rows: HistoricalGroupItem[];
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
  UNVERIFIED: { label: "--", type: "info" },
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
  return value ? speechLabels[value] : "--";
}

function roleLabel(value: HistoricalGroupSelfRole | null): string {
  return value ? roleLabels[value] : "--";
}

function formatCreatedAt(value: number | null): string {
  return value ? dayjs.unix(value).format("YYYY-MM-DD HH:mm:ss") : "--";
}

function rowClassName({ row }: { row: HistoricalGroupItem }): string {
  return row.operable ? "" : "historical-group-row-disabled";
}

function openDetail(row: unknown): void {
  if (!row || typeof row !== "object" || !("groupJid" in row)) return;
  emit("open-detail", row as HistoricalGroupItem);
}
</script>

<template>
  <div v-loading="loading" class="historical-group-table">
    <el-empty v-if="!accountGroupSelected" description="请先选择账号分组" />
    <el-empty
      v-else-if="rows.length === 0 && !loading"
      description="当前账号分组没有历史群"
    />
    <el-table
      v-else
      :data="rows"
      row-key="groupJid"
      :row-class-name="rowClassName"
    >
      <el-table-column label="群名称" min-width="180">
        <template #default="{ row }">
          <span>{{ row.subject || "--" }}</span>
        </template>
      </el-table-column>
      <el-table-column label="关联账号" min-width="160">
        <template #default="{ row }">
          <el-tooltip
            v-if="row.accountPhones.length > 1"
            placement="top"
            effect="dark"
          >
            <template #content>
              <div
                v-for="phone in row.accountPhones"
                :key="phone"
                class="linked-account"
              >
                {{ phone }}
              </div>
            </template>
            <span>{{ row.accountPhones[0] }}</span>
          </el-tooltip>
          <span v-else>{{ row.accountPhones[0] || "--" }}</span>
        </template>
      </el-table-column>
      <el-table-column label="群链接" min-width="220">
        <template #default="{ row }">
          <el-link
            v-if="row.inviteLink"
            :href="row.inviteLink"
            target="_blank"
            type="primary"
          >
            {{ row.inviteLink }}
          </el-link>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="国家" min-width="130">
        <template #default="{ row }">
          <span>{{ row.countryFlag || "" }} {{ row.countryName || "--" }}</span>
        </template>
      </el-table-column>
      <el-table-column label="群组创建时间" width="180">
        <template #default="{ row }">
          {{ formatCreatedAt(row.groupCreatedAt) }}
        </template>
      </el-table-column>
      <el-table-column label="当前关系" width="110">
        <template #default="{ row }">
          <el-tag :type="membershipMeta[row.membershipState].type">
            {{ membershipMeta[row.membershipState].label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="自身角色" width="110">
        <template #default="{ row }">
          {{ roleLabel(row.selfRole) }}
        </template>
      </el-table-column>
      <el-table-column label="发言状态" width="130">
        <template #default="{ row }">
          {{ speechLabel(row.speechState) }}
        </template>
      </el-table-column>
      <el-table-column label="群人数" width="90">
        <template #default="{ row }">
          {{ row.memberSize ?? "--" }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="110">
        <template #default="{ row }">
          <el-tooltip
            :disabled="row.operable || !row.disabledReason"
            :content="row.disabledReason || ''"
            placement="top"
          >
            <span>
              <el-button
                link
                type="primary"
                :disabled="!row.operable"
                @click="openDetail(row)"
              >
                查看详情
              </el-button>
            </span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="完整群 JID" min-width="260">
        <template #default="{ row }">
          <span class="full-value">{{ row.groupJid }}</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.full-value {
  word-break: break-all;
  white-space: pre-wrap;
}

.linked-account + .linked-account {
  margin-top: 4px;
}

.historical-group-table :deep(.historical-group-row-disabled) {
  color: var(--el-text-color-disabled);
  background: var(--el-fill-color-light);
}
</style>
