<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { TierCheckItem } from "@/api/account-tier-check";
import { hasPerms } from "@/utils/auth";
import { formatEpochMillis } from "@/utils/time";
import TierCheckTimelineDrawer from "./TierCheckTimelineDrawer.vue";
import { useTierCheckDetail } from "../composables/useTierCheckDetail";
import {
  changeTagType,
  changeText,
  checkModeText,
  itemStatusText,
  reasonLabel,
  taskStatusText,
  tierLabel,
  tierTagType,
  userTypeText
} from "../tier-check-display";

const open = defineModel<boolean>({ default: false });
const props = defineProps<{ taskId: number | null }>();
const emit = defineEmits<{ (event: "changed"): void }>();
const canEdit = computed(() => hasPerms("tenant:account:edit"));
const {
  task,
  items,
  itemPage,
  itemTotal,
  filter,
  busy,
  error,
  sortedTierCounts,
  act
} = useTierCheckDetail(
  open,
  computed(() => props.taskId)
);
const timelineOpen = ref(false);
const timelineAccountId = ref<number | null>(null);
watch(
  () => [open.value, props.taskId],
  () => {
    timelineOpen.value = false;
  }
);
async function perform(
  action: "stop" | "retry" | "recheck",
  success: string
): Promise<void> {
  if (!canEdit.value) return;
  if (await act(action)) {
    ElMessage.success(success);
    emit("changed");
  }
}
const stop = () => perform("stop", "已停止");
const retry = () => perform("retry", "已重新排队");
async function recheck(): Promise<void> {
  const id = props.taskId;
  try {
    await ElMessageBox.confirm(
      `将对批次 #${id} 的同一批账号再次检测。`,
      "复查此批",
      { confirmButtonText: "开始复查", cancelButtonText: "取消" }
    );
  } catch {
    return;
  }
  if (open.value && props.taskId === id)
    await perform("recheck", "已创建复查批次");
}
function showTimeline(row: TierCheckItem): void {
  timelineAccountId.value = row.accountId;
  timelineOpen.value = true;
}
</script>

<template>
  <el-drawer v-model="open" title="档位检测详情" size="min(100%, 1080px)">
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      show-icon
      @close="error = ''"
    />
    <template v-if="task">
      <div class="flex items-center justify-between">
        <strong
          >批次 #{{ task.id }}：{{ task.name }} ·
          {{ taskStatusText[task.status] }} ·
          {{ checkModeText[task.mode] }}</strong
        >
        <div v-if="canEdit">
          <el-button :disabled="busy || task.status !== 1" @click="stop"
            >停止</el-button
          >
          <el-button :disabled="busy || !task.stats.failed" @click="retry"
            >重试失败项</el-button
          >
          <el-button
            type="primary"
            :disabled="busy || task.status === 1"
            @click="recheck"
            >复查此批</el-button
          >
        </div>
      </div>
      <p class="my-3">
        共 {{ task.stats.total }} 个 · 已查到 {{ task.stats.success }} · 失败
        {{ task.stats.failed }} · 不可查 {{ task.stats.unqueryable }} · 待查
        {{ task.stats.pending }}
        <template v-if="task.finishedAt">
          · 完成于 {{ formatEpochMillis(task.finishedAt) }}</template
        >
      </p>
      <p class="my-3">
        本次分布：
        <el-tag
          v-for="entry in sortedTierCounts"
          :key="entry.tier"
          class="mr-2"
          :type="tierTagType[entry.tier]"
          >{{ tierLabel(entry.tier) }} {{ entry.count }}</el-tag
        >
      </p>
      <p v-if="task.sourceTaskId" class="my-3">
        复查自 #{{ task.sourceTaskId }}
        <template v-if="task.sourceTaskName"
          >（{{ task.sourceTaskName }}）</template
        >；各账号与最近一次成功检测相比：
        <el-tag class="mr-2" type="success">上升 {{ task.stats.up }}</el-tag>
        <el-tag class="mr-2" type="danger">下降 {{ task.stats.down }}</el-tag>
        <el-tag class="mr-2" type="warning"
          >方向不明 {{ task.stats.unknown }}</el-tag
        >
        <el-tag class="mr-2" type="info">不变 {{ task.stats.same }}</el-tag>
        <el-tag type="info">未查到 {{ task.stats.lost }}</el-tag>
      </p>
      <el-alert
        v-if="task.sourceTaskId"
        class="my-3"
        title="档位高低顺序是推断：只在 可疑 < TIER_0 < TIER_1 < TIER_2 < TIER_3 之间判上升或下降，涉及未分档的变化记为方向不明。"
        type="info"
        :closable="false"
      />
      <el-radio-group v-model="filter" class="my-3">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="changed">只看有变化</el-radio-button>
        <el-radio-button value="lost">未查到</el-radio-button>
      </el-radio-group>
      <el-table :data="items" row-key="id" border empty-text="暂无匹配结果">
        <el-table-column prop="phone" label="号码" min-width="130" />
        <el-table-column label="类型" width="80">
          <template #default="{ row }">{{
            userTypeText[row.serverUserType ?? ""] ?? "-"
          }}</template>
        </el-table-column>
        <el-table-column label="本次档位" width="100">
          <template #default="{ row }">
            <el-tag
              v-if="row.trustTier"
              :type="tierTagType[row.trustTier] ?? 'info'"
              >{{ tierLabel(row.trustTier) }}</el-tag
            >
            <el-tag v-else type="info">{{ itemStatusText[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="上次档位" width="100">
          <template #default="{ row }">
            <el-tag
              v-if="row.prevTrustTier"
              :type="tierTagType[row.prevTrustTier] ?? 'info'"
              >{{ tierLabel(row.prevTrustTier) }}</el-tag
            >
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="变化" width="155">
          <template #default="{ row }">
            <el-tag size="small" :type="changeTagType[row.tierChange]">{{
              changeText[row.tierChange]
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" width="150">
          <template #default="{ row }">{{
            formatEpochMillis(row.joinDateMs)
          }}</template>
        </el-table-column>
        <el-table-column label="国家" width="70">
          <template #default="{ row }">{{
            row.phoneCountryCode ?? "-"
          }}</template>
        </el-table-column>
        <el-table-column label="原因" min-width="150">
          <template #default="{ row }">{{
            reasonLabel(row.reasonCode)
          }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="showTimeline(row)"
              >时间线</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="itemPage"
        :page-size="20"
        :total="itemTotal"
        layout="total, prev, pager, next"
        class="my-3"
      />
    </template>
    <TierCheckTimelineDrawer
      v-model="timelineOpen"
      :account-id="timelineAccountId"
    />
  </el-drawer>
</template>
