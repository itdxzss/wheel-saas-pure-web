<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import {
  getPullTaskStandardGroupAvatarContent,
  type PullTaskCreationMode,
  type PullTaskStandardGroupSetting,
  type PullTaskStandardSetting
} from "@/api/pull-task";

defineOptions({
  name: "PullTaskStandardSavedSettings"
});

const props = defineProps<{
  visible: boolean;
  creationMode: PullTaskCreationMode;
  standardSetting: PullTaskStandardSetting;
  groupSetting: PullTaskStandardGroupSetting;
}>();

const avatarObjectUrl = ref<string | null>(null);
const avatarLoading = ref(false);
const avatarLoadFailed = ref(false);
let avatarRequestId = 0;

const settingLabels: Record<string, string> = {
  SINGLE: "单个",
  BATCH: "批量",
  BEFORE_PULL: "拉人之前设置",
  AFTER_PULL: "拉完人后设置",
  UNCHANGED: "不操作",
  ALLOW: "允许",
  DISALLOW: "不允许",
  MUTE: "禁言",
  UNMUTE: "不禁言",
  ALL: "所有人",
  ADMIN_ONLY: "仅管理员",
  ONE_DAY: "24 小时",
  SEVEN_DAYS: "7 天",
  NINETY_DAYS: "90 天",
  OFF: "关闭"
};

function yesNo(value?: boolean | null): string {
  return value ? "是" : "否";
}

function namedGroup(name?: string | null): string {
  return name || "未设置";
}

function settingLabel(value?: string | null): string {
  return value ? (settingLabels[value] ?? value) : "未设置";
}

function revokeAvatarObjectUrl(): void {
  if (!avatarObjectUrl.value) return;
  URL.revokeObjectURL(avatarObjectUrl.value);
  avatarObjectUrl.value = null;
}

async function loadAvatar(open: boolean, previewUrl?: string | null) {
  const requestId = ++avatarRequestId;
  revokeAvatarObjectUrl();
  avatarLoading.value = Boolean(open && previewUrl);
  avatarLoadFailed.value = false;
  if (!open || !previewUrl) return;
  try {
    const blob = await getPullTaskStandardGroupAvatarContent(previewUrl);
    if (requestId !== avatarRequestId) return;
    avatarObjectUrl.value = URL.createObjectURL(blob);
  } catch {
    if (requestId === avatarRequestId) avatarLoadFailed.value = true;
  } finally {
    if (requestId === avatarRequestId) avatarLoading.value = false;
  }
}

watch(
  [() => props.visible, () => props.groupSetting.avatarPreviewUrl],
  ([open, previewUrl]) => void loadAvatar(open, previewUrl),
  { immediate: true }
);

onBeforeUnmount(() => {
  avatarRequestId += 1;
  revokeAvatarObjectUrl();
});
</script>

<template>
  <el-collapse class="saved-settings">
    <el-collapse-item title="已保存任务配置" name="saved-settings">
      <el-divider content-position="left">执行设置</el-divider>
      <el-descriptions :column="3" border size="small">
        <el-descriptions-item label="创建模式">
          {{
            creationMode === "NEW_GROUP"
              ? "新群模式"
              : creationMode === "RESOURCE_POOL"
                ? "资源池模式"
                : "群链接模式"
          }}
        </el-descriptions-item>
        <el-descriptions-item label="自动启动">
          {{ standardSetting.autoStart === 1 ? "是" : "否" }}
        </el-descriptions-item>
        <el-descriptions-item label="拉人完成后群主退群">
          {{ yesNo(standardSetting.creatorLeaveAfterPull) }}
        </el-descriptions-item>
        <el-descriptions-item label="群组分组">
          {{ namedGroup(standardSetting.groupFolderName) }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="creationMode === 'NEW_GROUP'"
          label="建群人分组"
        >
          {{ namedGroup(standardSetting.creatorGroupName) }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="creationMode === 'NEW_GROUP'"
          label="建群时站台数量"
        >
          {{ standardSetting.initialStationCount }}
        </el-descriptions-item>
        <el-descriptions-item label="拉手同步料子方式">
          {{ settingLabel(standardSetting.pullerSyncMode) }}
        </el-descriptions-item>
        <el-descriptions-item label="设置料子内容管理">
          {{
            standardSetting.materialAdminTiming === 1
              ? "任务开始后设置"
              : "任务完成后设置"
          }}
        </el-descriptions-item>
        <el-descriptions-item label="清空群原成员">
          {{ yesNo(standardSetting.clearExistingMembers) }}
        </el-descriptions-item>
        <el-descriptions-item label="拉手踩链接进群">
          {{ yesNo(standardSetting.pullerJoinByLink) }}
        </el-descriptions-item>
        <el-descriptions-item label="前期单次拉人数">
          {{ standardSetting.earlyPullCount }}
        </el-descriptions-item>
        <el-descriptions-item label="前期拉人执行次数">
          {{ standardSetting.earlyPullCallCount }} 次
        </el-descriptions-item>
        <el-descriptions-item label="单次拉人数范围">
          {{ standardSetting.pullCountMin }} ~
          {{ standardSetting.pullCountMax }}
        </el-descriptions-item>
        <el-descriptions-item label="拉人间隔">
          {{ standardSetting.pullIntervalSeconds }} 秒
        </el-descriptions-item>
        <el-descriptions-item label="拉手数量">
          {{ standardSetting.pullerCountPerGroup }}
        </el-descriptions-item>
        <el-descriptions-item label="站台数量/次">
          {{ standardSetting.stationCountPerCall }}
        </el-descriptions-item>
        <el-descriptions-item label="同时启动任务数">
          {{ standardSetting.concurrentGroupCount }}
        </el-descriptions-item>
        <el-descriptions-item label="管理分组">
          {{ namedGroup(standardSetting.managerGroupName) }}
        </el-descriptions-item>
        <el-descriptions-item label="拉手分组">
          {{ namedGroup(standardSetting.pullerGroupName) }}
        </el-descriptions-item>
        <el-descriptions-item label="站台分组">
          {{ namedGroup(standardSetting.stationGroupName) }}
        </el-descriptions-item>
        <el-descriptions-item label="管理完成归档分组">
          {{ namedGroup(standardSetting.managerFinishGroupName) }}
        </el-descriptions-item>
        <el-descriptions-item label="拉手完成归档分组">
          {{ namedGroup(standardSetting.pullerFinishGroupName) }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">群信息设置</el-divider>
      <div class="saved-group-profile">
        <el-image
          v-if="avatarObjectUrl"
          :src="avatarObjectUrl"
          fit="cover"
          class="saved-avatar"
        />
        <span v-else-if="avatarLoading" class="avatar-placeholder">
          头像加载中...
        </span>
        <span v-else-if="avatarLoadFailed" class="avatar-placeholder">
          头像加载失败
        </span>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="总开关">
            {{ groupSetting.enabled ? "开启" : "关闭" }}
          </el-descriptions-item>
          <el-descriptions-item label="设置顺序">
            {{ settingLabel(groupSetting.settingTiming) }}
          </el-descriptions-item>
          <el-descriptions-item label="群名来源">
            {{
              groupSetting.useMaterialFileNameAsGroupName
                ? "料子文件名"
                : "手动设置"
            }}
          </el-descriptions-item>
          <el-descriptions-item label="群名称">
            {{ groupSetting.groupName || "未设置" }}
          </el-descriptions-item>
          <el-descriptions-item label="群描述" :span="3">
            {{ groupSetting.groupDescription || "未设置" }}
          </el-descriptions-item>
          <el-descriptions-item label="任务后自动关闭禁言">
            {{ yesNo(groupSetting.autoCloseMuteAfterTask) }}
          </el-descriptions-item>
          <el-descriptions-item label="任务后自动关闭拉人权限">
            {{ yesNo(groupSetting.autoCloseInviteAfterTask) }}
          </el-descriptions-item>
          <el-descriptions-item label="编辑群设置">
            {{ settingLabel(groupSetting.editPermission) }}
          </el-descriptions-item>
          <el-descriptions-item label="群禁言">
            {{ settingLabel(groupSetting.muteMode) }}
          </el-descriptions-item>
          <el-descriptions-item label="获取群链接权限">
            {{ settingLabel(groupSetting.linkPermission) }}
          </el-descriptions-item>
          <el-descriptions-item label="限时消息">
            {{ settingLabel(groupSetting.disappearingMessage) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-collapse-item>
  </el-collapse>
</template>

<style scoped>
.saved-settings {
  margin: 16px 0;
}

.saved-group-profile {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.saved-avatar {
  width: 96px;
  height: 96px;
  border-radius: 6px;
}

@media (width <= 900px) {
  .saved-group-profile {
    grid-template-columns: 1fr;
  }
}
</style>
