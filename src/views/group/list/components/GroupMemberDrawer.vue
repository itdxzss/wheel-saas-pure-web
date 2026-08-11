<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox, type UploadFile } from "element-plus";
import {
  demoteGroupMembers,
  getGroupDetail,
  kickGroupMembers,
  promoteGroupMembers,
  requestGroupMetadataSync,
  uploadGroupAvatar,
  type GroupDetail,
  type GroupListRow,
  type GroupMember
} from "@/api/group";
import { apiErrorMessage } from "@/utils/api-error";
import { timedMessageOptions } from "../constants";
import { saveChangedGroupProfile } from "../composables/useGroupProfileSaving";
import { useGroupTimedMessage } from "../composables/useGroupTimedMessage";
import { applyGroupMemberActionResult } from "../memberActionResult";
import {
  emptyGroupPermissions,
  useGroupPermissions
} from "../composables/useGroupPermissions";

defineOptions({
  name: "GroupMemberDrawer"
});

const props = defineProps<{
  group: GroupListRow | null;
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (event: "refresh"): void;
  (event: "update:modelValue", value: boolean): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});
const detail = ref<GroupDetail | null>(null);
const loading = ref(false);
const savingProfile = ref(false);
const uploadingAvatar = ref(false);
const refreshingMetadata = ref(false);
const memberSearch = ref("");
const selectedJids = ref<string[]>([]);
const avatarPreviewUrl = ref<string | null>(null);
const objectUrl = ref<string | null>(null);
const profileForm = reactive({
  groupName: "",
  remark: ""
});
const profileBaseline = reactive({ ...profileForm });
const {
  changeMode: onTimedMessageChange,
  mode: timedMessageMode,
  reset: resetTimedMessage,
  saving: savingTimedMessage,
  setMode: setTimedMessageMode
} = useGroupTimedMessage({
  groupId: () => props.group?.id ?? null,
  reload: loadDetail
});
const {
  permissions,
  reset: resetPermissions,
  saving: savingPermission,
  setPermissions,
  toggle: togglePermission
} = useGroupPermissions({
  groupId: () => props.group?.id ?? null,
  reload: loadDetail
});

const filteredMembers = computed<GroupMember[]>(() => {
  const members = detail.value?.members ?? [];
  const raw = memberSearch.value.trim().toLowerCase();
  if (!raw) return members;
  const tokens = raw.split(/[\s,，]+/).filter(Boolean);
  return members.filter(member =>
    tokens.some(
      token =>
        member.phone?.toLowerCase().includes(token) ||
        member.name?.toLowerCase().includes(token) ||
        member.jid?.toLowerCase().includes(token)
    )
  );
});
const batchDisabled = computed(
  () =>
    loading.value ||
    !detail.value?.membersAvailable ||
    selectedJids.value.length === 0
);

function displayGroupName(group: GroupListRow | null): string {
  if (!group) return "";
  return group.groupName || group.waSubject || `群组 ${group.id}`;
}

function fallbackDetail(group: GroupListRow, reason: string): GroupDetail {
  return {
    groupLinkId: group.id,
    groupJid: group.groupJid ?? null,
    groupName: displayGroupName(group),
    remark: group.remark ?? null,
    avatarUrl: group.avatarUrl ?? null,
    liveStateAvailable: false,
    liveStateUnavailableReason: reason,
    timedMessageMode: null,
    permissions: emptyGroupPermissions(),
    capabilities: {
      inviteViaLink: { supported: false, reason }
    },
    membersAvailable: false,
    membersUnavailableReason: reason,
    members: [],
    metadataSyncStatus: group.metadataSyncStatus ?? null,
    metadataSyncedAt: group.metadataSyncedAt ?? null,
    metadataSyncError: group.metadataSyncError ?? null
  };
}

function resetRealtimeState(): void {
  resetTimedMessage();
  resetPermissions();
}

function resetState(): void {
  detail.value = null;
  memberSearch.value = "";
  selectedJids.value = [];
  resetRealtimeState();
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value);
  objectUrl.value = null;
  avatarPreviewUrl.value = null;
}

function hydrateFromGroup(group: GroupListRow | null): void {
  profileForm.groupName = displayGroupName(group);
  profileForm.remark = group?.remark ?? "";
  Object.assign(profileBaseline, profileForm);
  avatarPreviewUrl.value = group?.avatarUrl ?? null;
}

async function loadDetail(): Promise<void> {
  const group = props.group;
  if (!group) return;
  loading.value = true;
  selectedJids.value = [];
  resetRealtimeState();
  try {
    const loaded = await getGroupDetail(group.id);
    detail.value = loaded;
    profileForm.groupName = loaded.groupName ?? displayGroupName(group);
    profileForm.remark = loaded.remark ?? group.remark ?? "";
    Object.assign(profileBaseline, profileForm);
    avatarPreviewUrl.value = loaded.avatarUrl ?? group.avatarUrl ?? null;
    setTimedMessageMode(loaded.timedMessageMode);
    setPermissions(loaded.permissions);
  } catch (error) {
    detail.value = fallbackDetail(
      group,
      apiErrorMessage(error, "群详情加载失败")
    );
  } finally {
    loading.value = false;
  }
}

async function refreshMetadata(): Promise<void> {
  const group = props.group;
  if (!group) return;
  refreshingMetadata.value = true;
  try {
    await requestGroupMetadataSync(group.id);
    ElMessage.success("已加入同步队列");
    await loadDetail();
    emit("refresh");
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "群信息刷新请求失败"));
  } finally {
    refreshingMetadata.value = false;
  }
}

async function saveProfile(): Promise<void> {
  const group = props.group;
  if (!group) return;
  const values = {
    groupName: profileForm.groupName.trim(),
    remark: profileForm.remark.trim()
  };
  savingProfile.value = true;
  const results = await saveChangedGroupProfile(
    group.id,
    values,
    profileBaseline
  );
  savingProfile.value = false;
  if (results.length === 0) {
    ElMessage.info("没有需要保存的修改");
    return;
  }
  let changed = false;
  results.forEach(operation => {
    if (operation.settled.status === "fulfilled") {
      profileBaseline[operation.field] = operation.value;
      if (operation.field === "groupName" && detail.value) {
        detail.value.groupName = operation.value;
      }
      ElMessage.success(`${operation.label}已保存`);
      changed = true;
    } else {
      ElMessage.error(
        apiErrorMessage(operation.settled.reason, `${operation.label}保存失败`)
      );
    }
  });
  if (changed) {
    emit("refresh");
  }
}

async function handleAvatarChange(uploadFile: UploadFile): Promise<void> {
  const group = props.group;
  const raw = uploadFile.raw;
  if (!group || !raw) return;
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value);
  objectUrl.value = URL.createObjectURL(raw);
  avatarPreviewUrl.value = objectUrl.value;
  uploadingAvatar.value = true;
  try {
    const result = await uploadGroupAvatar(group.id, raw);
    if (!result.applied) {
      ElMessage.warning("群头像未更新");
      return;
    }
    avatarPreviewUrl.value = result.avatarUrl ?? avatarPreviewUrl.value;
    if (detail.value) detail.value.avatarUrl = result.avatarUrl;
    if (result.mirrorSynced) {
      ElMessage.success("群头像已更新");
    } else {
      ElMessage.warning("头像已更新，本地列表待刷新");
    }
    emit("refresh");
  } catch (error) {
    avatarPreviewUrl.value = detail.value?.avatarUrl ?? group.avatarUrl ?? null;
    ElMessage.error(apiErrorMessage(error, "群头像上传失败"));
  } finally {
    uploadingAvatar.value = false;
  }
}

function onMemberSelectionChange(selection: GroupMember[]): void {
  selectedJids.value = selection.map(item => item.jid);
}

async function runMemberAction(
  action: "promote" | "demote" | "kick"
): Promise<void> {
  const group = props.group;
  if (!group || selectedJids.value.length === 0) return;
  if (action === "kick") {
    try {
      await ElMessageBox.confirm(
        `确认踢出已选择的 ${selectedJids.value.length} 名成员吗？`,
        "踢出成员确认",
        {
          type: "warning",
          confirmButtonText: "踢出",
          cancelButtonText: "取消"
        }
      );
    } catch {
      return;
    }
  }
  try {
    const call =
      action === "promote"
        ? promoteGroupMembers
        : action === "demote"
          ? demoteGroupMembers
          : kickGroupMembers;
    const result = await call(group.id, selectedJids.value);
    if (result.ok) {
      ElMessage.success(result.message || "成员操作已提交");
    } else {
      ElMessage.warning(result.message || "成员操作未完成");
    }
    if (result.partial) {
      const failures = (result.results ?? [])
        .filter(item => item.status !== "OK")
        .map(item => `${item.jid}：${item.reason || item.status}`)
        .join("\n");
      await ElMessageBox.alert(
        failures || result.message || "部分成员操作未完成",
        "成员操作结果",
        { type: "warning", confirmButtonText: "知道了" }
      );
    }
    if (detail.value) {
      detail.value.members = applyGroupMemberActionResult(
        detail.value.members,
        action,
        result
      );
    }
    selectedJids.value = [];
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "成员操作失败"));
  }
}

watch(
  () => props.modelValue,
  isOpen => {
    if (isOpen) {
      hydrateFromGroup(props.group);
      void loadDetail();
    } else {
      resetState();
    }
  }
);

watch(
  () => props.group,
  group => {
    if (props.modelValue) {
      hydrateFromGroup(group);
      void loadDetail();
    }
  }
);

onBeforeUnmount(resetState);
</script>

<template>
  <el-drawer
    v-model="visible"
    title="群详情"
    size="540px"
    destroy-on-close
    class="group-member-drawer"
  >
    <div v-if="group" class="drawer-content">
      <section class="drawer-group-head">
        <el-avatar :size="56" :src="avatarPreviewUrl || undefined">
          {{
            (detail?.groupName || displayGroupName(group)).slice(0, 1) || "群"
          }}
        </el-avatar>
        <div class="drawer-group-meta">
          <strong>{{ detail?.groupName || displayGroupName(group) }}</strong>
          <span>{{
            detail?.groupJid || group.groupJid || "groupJid 待回填"
          }}</span>
        </div>
        <el-button
          class="refresh-metadata-button"
          :loading="refreshingMetadata"
          @click="refreshMetadata"
        >
          刷新群信息
        </el-button>
      </section>

      <el-alert
        v-if="detail"
        class="metadata-status"
        :type="detail.membersAvailable ? 'success' : 'warning'"
        :closable="false"
        show-icon
      >
        <template #title>
          metadata：{{ detail.metadataSyncStatus || "未排队" }}；最后同步：{{
            detail.metadataSyncedAt || "-"
          }}
        </template>
        <template v-if="detail.metadataSyncError" #default>
          {{ detail.metadataSyncError }}
        </template>
      </el-alert>

      <el-form class="drawer-section" :model="profileForm" label-position="top">
        <el-form-item label="群头像">
          <el-upload
            accept="image/*"
            :auto-upload="false"
            :limit="1"
            :show-file-list="false"
            :on-change="handleAvatarChange"
          >
            <el-button :loading="uploadingAvatar">更换群头像</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="群名称">
          <el-input v-model="profileForm.groupName" clearable />
        </el-form-item>
        <el-form-item label="群备注">
          <el-input
            v-model="profileForm.remark"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-button type="primary" :loading="savingProfile" @click="saveProfile">
          保存群资料
        </el-button>
      </el-form>

      <section class="drawer-section">
        <div class="drawer-section-title">限时消息</div>
        <el-radio-group
          v-model="timedMessageMode"
          class="timed-message-group"
          :disabled="loading || savingTimedMessage || timedMessageMode == null"
          @change="onTimedMessageChange"
        >
          <el-radio-button
            v-for="item in timedMessageOptions"
            :key="item.value"
            :label="item.value"
          >
            {{ item.label }}
          </el-radio-button>
        </el-radio-group>
      </section>

      <section class="drawer-section">
        <div class="drawer-section-title">群组权限</div>
        <div class="permission-list">
          <label class="permission-row">
            <span>编辑群组设置</span>
            <el-switch
              :model-value="permissions.editGroupSettings ?? false"
              :disabled="
                loading ||
                savingPermission ||
                permissions.editGroupSettings == null
              "
              @change="togglePermission('editGroupSettings')"
            />
          </label>
          <label class="permission-row">
            <span>发送新消息</span>
            <el-switch
              :model-value="permissions.sendMessages ?? false"
              :disabled="
                loading || savingPermission || permissions.sendMessages == null
              "
              @change="togglePermission('sendMessages')"
            />
          </label>
          <label class="permission-row">
            <span>添加其他成员</span>
            <el-switch
              :model-value="permissions.addMembers ?? false"
              :disabled="
                loading || savingPermission || permissions.addMembers == null
              "
              @change="togglePermission('addMembers')"
            />
          </label>
          <label class="permission-row">
            <span class="permission-label">
              通过链接邀请
              <small v-if="detail?.capabilities.inviteViaLink.reason">
                {{ detail.capabilities.inviteViaLink.reason }}
              </small>
            </span>
            <el-switch
              :model-value="permissions.inviteViaLink ?? false"
              :disabled="
                loading ||
                savingPermission ||
                permissions.inviteViaLink == null ||
                !detail?.capabilities.inviteViaLink.supported
              "
              @change="togglePermission('inviteViaLink')"
            />
          </label>
          <label class="permission-row">
            <span>管理员可以批准新成员</span>
            <el-switch
              :model-value="permissions.adminApproveNewMembers ?? false"
              :disabled="
                loading ||
                savingPermission ||
                permissions.adminApproveNewMembers == null
              "
              @change="togglePermission('adminApproveNewMembers')"
            />
          </label>
        </div>
      </section>

      <section class="drawer-section">
        <div class="drawer-section-title">
          群成员列表
          <el-tag v-if="selectedJids.length" size="small">
            已选 {{ selectedJids.length }}
          </el-tag>
        </div>
        <el-input
          v-model="memberSearch"
          clearable
          placeholder="请输入WS号，多个账号用空格/换行/逗号分隔"
        >
          <template #append>
            <el-button :loading="loading" @click="loadDetail"
              >重新读取</el-button
            >
          </template>
        </el-input>
        <el-alert
          v-if="detail && !detail.membersAvailable"
          class="member-alert"
          type="warning"
          :closable="false"
          show-icon
        >
          <template #title>
            成员数据暂不可用：{{
              detail?.membersUnavailableReason || "后端接口未返回成员数据"
            }}
          </template>
        </el-alert>
        <el-table
          v-loading="loading"
          :data="filteredMembers"
          row-key="jid"
          border
          @selection-change="onMemberSelectionChange"
        >
          <el-table-column
            type="selection"
            width="46"
            :selectable="row => !row.locked"
          />
          <el-table-column prop="name" label="昵称" min-width="120" />
          <el-table-column prop="phone" label="WS号" min-width="150" />
          <el-table-column label="角色" width="110">
            <template #default="{ row }">
              <el-tag size="small">{{ row.roleText || row.role }}</el-tag>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty
              :description="
                detail?.membersAvailable ? '暂无成员数据' : '详情待同步'
              "
            />
          </template>
        </el-table>
      </section>
    </div>

    <template #footer>
      <el-button
        type="primary"
        :disabled="batchDisabled"
        @click="runMemberAction('promote')"
      >
        设置管理员
      </el-button>
      <el-button :disabled="batchDisabled" @click="runMemberAction('demote')">
        取消管理员
      </el-button>
      <el-button
        type="danger"
        plain
        :disabled="batchDisabled"
        @click="runMemberAction('kick')"
      >
        踢出
      </el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
.drawer-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.drawer-group-head {
  display: flex;
  gap: 12px;
  align-items: center;
}

.drawer-group-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.drawer-group-meta span {
  color: var(--el-text-color-secondary);
}

.refresh-metadata-button {
  margin-left: auto;
}

.metadata-status {
  margin-top: 4px;
}

.drawer-section {
  padding-top: 14px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.drawer-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-weight: 600;
}

.timed-message-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.permission-list {
  display: grid;
  gap: 10px;
}

.permission-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.permission-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.permission-label small {
  color: var(--el-text-color-secondary);
}

.member-alert {
  margin: 10px 0;
}
</style>
