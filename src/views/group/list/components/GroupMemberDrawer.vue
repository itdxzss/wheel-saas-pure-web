<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from "vue";
import {
  ElMessage,
  ElMessageBox,
  type TableInstance,
  type UploadFile,
  type UploadInstance
} from "element-plus";
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
import {
  applyGroupMemberActionResult,
  reconcileGroupMemberActionResult
} from "../memberActionResult";
import {
  emptyGroupPermissions,
  useGroupPermissions
} from "../composables/useGroupPermissions";
import { waitForGroupMetadataRefresh } from "../composables/waitForGroupMetadataRefresh";
import { useGroupCreatorLeave } from "../composables/useGroupCreatorLeave";

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
const avatarUploadRef = ref<UploadInstance>();
const memberTableRef = ref<TableInstance>();
const refreshingMetadata = ref(false);
const memberSearch = ref("");
const selectedJids = ref<string[]>([]);
const avatarPreviewUrl = ref<string | null>(null);
const objectUrl = ref<string | null>(null);
let detailLoadSession = 0;
let metadataRefreshSession = 0;
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
  groupId: () => props.group?.id ?? null
});
const {
  capabilityLoading: creatorLeaveCapabilityLoading,
  creatorLeaveExecutable,
  creatorLeaveReason,
  creatorLeaving,
  loadCreatorLeaveCapability,
  resetCreatorLeave,
  runCreatorLeave
} = useGroupCreatorLeave({
  groupId: () => props.group?.id ?? null,
  active: () => props.modelValue,
  onSuccess: () => emit("refresh")
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

function invalidateDetailLoad(): void {
  detailLoadSession += 1;
  loading.value = false;
}

function resetState(): void {
  invalidateDetailLoad();
  metadataRefreshSession += 1;
  detail.value = null;
  memberSearch.value = "";
  selectedJids.value = [];
  resetCreatorLeave();
  resetRealtimeState();
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value);
  objectUrl.value = null;
  avatarPreviewUrl.value = null;
}

function applyDetail(group: GroupListRow, loaded: GroupDetail): void {
  detail.value = loaded;
  profileForm.groupName = loaded.groupName ?? displayGroupName(group);
  profileForm.remark = loaded.remark ?? group.remark ?? "";
  Object.assign(profileBaseline, profileForm);
  avatarPreviewUrl.value = loaded.avatarUrl ?? group.avatarUrl ?? null;
  setTimedMessageMode(loaded.timedMessageMode);
  setPermissions(loaded.permissions);
}

function hydrateFromGroup(group: GroupListRow | null): void {
  profileForm.groupName = displayGroupName(group);
  profileForm.remark = group?.remark ?? "";
  Object.assign(profileBaseline, profileForm);
  avatarPreviewUrl.value = group?.avatarUrl ?? null;
}

interface LoadDetailOptions {
  excludedMemberJids?: readonly string[];
  preserveCurrentOnError?: boolean;
  selectionJids?: readonly string[];
}

function isCurrentDetailLoad(
  session: number,
  groupId: GroupListRow["id"]
): boolean {
  return (
    session === detailLoadSession &&
    props.modelValue &&
    props.group?.id === groupId
  );
}

async function restoreMemberSelection(
  jids: readonly string[],
  canApply: () => boolean = () => true
): Promise<void> {
  if (!canApply()) return;
  const requested = new Set(jids);
  const selectedMembers = filteredMembers.value.filter(
    member => requested.has(member.jid) && !member.locked
  );
  selectedJids.value = selectedMembers.map(member => member.jid);
  await nextTick();
  if (!canApply()) return;
  memberTableRef.value?.clearSelection();
  selectedMembers.forEach(member =>
    memberTableRef.value?.toggleRowSelection(member, true)
  );
}

async function loadDetail(options: LoadDetailOptions = {}): Promise<void> {
  const group = props.group;
  if (!group || !props.modelValue) return;
  const groupId = group.id;
  const loadSession = ++detailLoadSession;
  const isCurrent = () => isCurrentDetailLoad(loadSession, groupId);
  loading.value = true;
  selectedJids.value = [];
  resetRealtimeState();
  try {
    const loaded = await getGroupDetail(group.id);
    if (!isCurrent()) return;
    const members = applyGroupMemberActionResult(
      loaded.members,
      "kick",
      options.excludedMemberJids ?? []
    );
    applyDetail(
      group,
      members === loaded.members ? loaded : { ...loaded, members }
    );
  } catch (error) {
    if (!isCurrent()) return;
    const reason = apiErrorMessage(error, "群详情加载失败");
    if (options.preserveCurrentOnError) {
      ElMessage.warning(`${reason}，已保留本次成员操作结果`);
    } else {
      detail.value = fallbackDetail(group, reason);
    }
  } finally {
    if (isCurrent()) {
      loading.value = false;
    }
  }
  if (!isCurrent()) return;
  await restoreMemberSelection(options.selectionJids ?? [], isCurrent);
}

async function refreshMetadata(): Promise<void> {
  const group = props.group;
  if (!group) return;
  const session = ++metadataRefreshSession;
  const previousSyncedAt = detail.value?.metadataSyncedAt ?? null;
  refreshingMetadata.value = true;
  try {
    await requestGroupMetadataSync(group.id);
    ElMessage.success("已加入同步队列");
    if (detail.value) {
      detail.value.metadataSyncStatus = "PENDING";
      detail.value.metadataSyncError = null;
    }
    const loaded = await waitForGroupMetadataRefresh({
      previousSyncedAt,
      isCurrent: () => session === metadataRefreshSession && props.modelValue,
      load: () => getGroupDetail(group.id),
      onProgress: current => {
        if (detail.value) {
          detail.value.metadataSyncStatus = current.metadataSyncStatus;
          detail.value.metadataSyncError = current.metadataSyncError;
        }
      }
    });
    if (loaded) {
      applyDetail(group, loaded);
      emit("refresh");
      ElMessage.success("群信息已刷新");
      return;
    }
    ElMessage.warning("群信息仍在同步，请稍后再试");
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
    avatarUploadRef.value?.clearFiles();
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
    const requestedJids = [...selectedJids.value];
    const isCurrentGroup = () =>
      props.modelValue && props.group?.id === group.id;
    const call =
      action === "promote"
        ? promoteGroupMembers
        : action === "demote"
          ? demoteGroupMembers
          : kickGroupMembers;
    const result = await call(group.id, requestedJids);
    if (!isCurrentGroup()) return;
    const outcome = reconcileGroupMemberActionResult(requestedJids, result);
    if (detail.value) {
      detail.value.members = applyGroupMemberActionResult(
        detail.value.members,
        action,
        outcome.succeededJids
      );
    }
    if (outcome.complete) {
      ElMessage.success(result.message || "成员操作已提交");
    } else if (outcome.succeededJids.length > 0) {
      ElMessage.warning(
        `已完成 ${outcome.succeededJids.length}/${requestedJids.length} 名成员操作，其余成员待重试`
      );
    } else {
      ElMessage.warning("成员操作未完成，未收到成员成功确认");
    }
    if (action === "kick" && outcome.succeededJids.length > 0) {
      await loadDetail({
        excludedMemberJids: outcome.succeededJids,
        preserveCurrentOnError: true,
        selectionJids: outcome.retryJids
      });
    } else {
      await restoreMemberSelection(outcome.retryJids, isCurrentGroup);
    }
    if (!isCurrentGroup()) return;
    if (outcome.failures.length > 0) {
      const failures = outcome.failures
        .map(item => `${item.jid}：${item.reason || item.status}`)
        .join("\n");
      try {
        await ElMessageBox.alert(failures, "成员操作结果", {
          type: "warning",
          confirmButtonText: "知道了"
        });
      } catch {
        // 关闭结果明细不改变已经确认的成员操作结果。
      }
    }
  } catch (error) {
    if (props.modelValue && props.group?.id === group.id) {
      ElMessage.error(apiErrorMessage(error, "成员操作失败"));
    }
  }
}

watch(
  () => props.modelValue,
  isOpen => {
    if (isOpen) {
      hydrateFromGroup(props.group);
      void loadDetail();
      void loadCreatorLeaveCapability();
    } else {
      resetState();
    }
  }
);

watch(
  () => props.group,
  group => {
    if (props.modelValue) {
      invalidateDetailLoad();
      metadataRefreshSession += 1;
      hydrateFromGroup(group);
      void loadDetail();
      void loadCreatorLeaveCapability();
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
            ref="avatarUploadRef"
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
              :disabled="loading || savingPermission"
              @change="
                value => togglePermission('editGroupSettings', Boolean(value))
              "
            />
          </label>
          <label class="permission-row">
            <span>发送新消息</span>
            <el-switch
              :model-value="permissions.sendMessages ?? false"
              :disabled="loading || savingPermission"
              @change="
                value => togglePermission('sendMessages', Boolean(value))
              "
            />
          </label>
          <label class="permission-row">
            <span>添加其他成员</span>
            <el-switch
              :model-value="permissions.addMembers ?? false"
              :disabled="loading || savingPermission"
              @change="value => togglePermission('addMembers', Boolean(value))"
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
              :disabled="loading || savingPermission"
              @change="
                value => togglePermission('inviteViaLink', Boolean(value))
              "
            />
          </label>
          <label class="permission-row">
            <span>管理员可以批准新成员</span>
            <el-switch
              :model-value="permissions.adminApproveNewMembers ?? false"
              :disabled="loading || savingPermission"
              @change="
                value =>
                  togglePermission('adminApproveNewMembers', Boolean(value))
              "
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
            <el-button :loading="loading" @click="loadDetail()"
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
          ref="memberTableRef"
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
        type="danger"
        :loading="creatorLeaving"
        :disabled="!creatorLeaveExecutable"
        :title="creatorLeaveReason"
        @click="runCreatorLeave"
      >
        群主退群
      </el-button>
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
      <span v-if="creatorLeaveCapabilityLoading" class="creator-leave-loading">
        正在检查退群条件...
      </span>
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
