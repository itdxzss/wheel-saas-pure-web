<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox, type UploadFile } from "element-plus";
import {
  demoteGroupMembers,
  getGroupMembers,
  kickGroupMembers,
  promoteGroupMembers,
  updateGroupProfile,
  updateGroupSettings,
  uploadGroupAvatar,
  type GroupDetail,
  type GroupListRow,
  type GroupMember,
  type GroupMemberList
} from "@/api/group";
import { apiErrorMessage } from "@/utils/api-error";
import { timedMessageOptions } from "../constants";
import { groupMemberFallbackReason } from "../group-member-availability";

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
const memberSearch = ref("");
const selectedJids = ref<string[]>([]);
const timedMessageMode = ref("off");
const avatarPreviewUrl = ref<string | null>(null);
const objectUrl = ref<string | null>(null);
const profileForm = reactive({
  groupName: "",
  remark: ""
});
const permissions = reactive({
  editGroupSettings: true,
  sendMessages: true,
  addMembers: true,
  inviteViaLink: true,
  adminApproveNewMembers: false
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
const batchDisabled = computed(() => selectedJids.value.length === 0);

function displayGroupName(group: GroupListRow | null): string {
  if (!group) return "";
  return group.groupName || group.waSubject || `群组 ${group.id}`;
}

function fallbackDetail(group: GroupListRow, reason: string): GroupDetail {
  return {
    id: group.id,
    groupJid: group.groupJid,
    groupName: displayGroupName(group),
    url: group.url,
    description: group.remark,
    memberCount: group.memberCount,
    membersAvailable: false,
    membersUnavailableReason: reason,
    locked: null,
    announcementOnly: null,
    members: []
  };
}

function memberListDetail(
  group: GroupListRow,
  memberList: GroupMemberList
): GroupDetail {
  return {
    id: group.id,
    groupJid: memberList.groupJid || group.groupJid,
    groupName: displayGroupName(group),
    url: group.url,
    description: group.remark,
    memberCount: memberList.total,
    membersAvailable: true,
    membersUnavailableReason: null,
    locked: null,
    announcementOnly: null,
    members: memberList.members
  };
}

function resetState(): void {
  detail.value = null;
  memberSearch.value = "";
  selectedJids.value = [];
  timedMessageMode.value = "off";
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value);
  objectUrl.value = null;
  avatarPreviewUrl.value = null;
}

function hydrateFromGroup(group: GroupListRow | null): void {
  profileForm.groupName = displayGroupName(group);
  profileForm.remark = group?.remark ?? "";
  avatarPreviewUrl.value = group?.avatarUrl ?? null;
}

async function loadDetail(): Promise<void> {
  const group = props.group;
  if (!group) return;
  loading.value = true;
  selectedJids.value = [];
  try {
    const fallbackReason = groupMemberFallbackReason(group);
    if (fallbackReason) {
      detail.value = fallbackDetail(group, fallbackReason);
      return;
    }
    detail.value = memberListDetail(group, await getGroupMembers(group.id));
    if (detail.value.locked != null) {
      permissions.editGroupSettings = !detail.value.locked;
    }
    if (detail.value.announcementOnly != null) {
      permissions.sendMessages = !detail.value.announcementOnly;
    }
  } catch (error) {
    detail.value = fallbackDetail(
      group,
      apiErrorMessage(error, "成员数据加载失败")
    );
  } finally {
    loading.value = false;
  }
}

async function saveProfile(): Promise<void> {
  const group = props.group;
  if (!group) return;
  savingProfile.value = true;
  try {
    await updateGroupProfile(group.id, {
      groupName: profileForm.groupName.trim(),
      remark: profileForm.remark.trim()
    });
    ElMessage.success("群资料已保存");
    emit("refresh");
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "群资料接口待接入或保存失败"));
  } finally {
    savingProfile.value = false;
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
    await uploadGroupAvatar(group.id, raw);
    ElMessage.success("群头像已更新");
    emit("refresh");
  } catch (error) {
    avatarPreviewUrl.value = group.avatarUrl ?? null;
    ElMessage.error(apiErrorMessage(error, "群头像接口待接入或上传失败"));
  } finally {
    uploadingAvatar.value = false;
  }
}

function onTimedMessageChange(): void {
  ElMessage.warning("限时消息接口待接入，当前仅完成前端入口");
}

async function togglePermission(key: keyof typeof permissions): Promise<void> {
  const group = props.group;
  if (!group) return;
  if (key !== "editGroupSettings" && key !== "sendMessages") {
    ElMessage.warning("该权限接口待接入，当前仅完成前端入口");
    return;
  }
  const oldValue = permissions[key];
  permissions[key] = !oldValue;
  try {
    const result = await updateGroupSettings(group.id, {
      locked: key === "editGroupSettings" ? !permissions[key] : undefined,
      announcementOnly: key === "sendMessages" ? !permissions[key] : undefined
    });
    if (result.applied) {
      ElMessage.success("群组权限已更新");
    } else {
      ElMessage.warning(result.reason || "群组权限接口已降级");
    }
  } catch (error) {
    permissions[key] = oldValue;
    ElMessage.error(apiErrorMessage(error, "群组权限接口待接入或更新失败"));
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
      await loadDetail();
    } else {
      ElMessage.warning(result.message || "成员操作未完成");
    }
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "成员操作接口待接入或操作失败"));
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
          {{ displayGroupName(group).slice(0, 1) || "群" }}
        </el-avatar>
        <div class="drawer-group-meta">
          <strong>{{ displayGroupName(group) }}</strong>
          <span>{{ group.groupJid || "groupJid 待回填" }}</span>
        </div>
      </section>

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
              :model-value="permissions.editGroupSettings"
              @change="togglePermission('editGroupSettings')"
            />
          </label>
          <label class="permission-row">
            <span>发送新消息</span>
            <el-switch
              :model-value="permissions.sendMessages"
              @change="togglePermission('sendMessages')"
            />
          </label>
          <label class="permission-row">
            <span>添加其他成员</span>
            <el-switch
              :model-value="permissions.addMembers"
              @change="togglePermission('addMembers')"
            />
          </label>
          <label class="permission-row">
            <span>通过链接邀请</span>
            <el-switch
              :model-value="permissions.inviteViaLink"
              @change="togglePermission('inviteViaLink')"
            />
          </label>
          <label class="permission-row">
            <span>管理员可以批准新成员</span>
            <el-switch
              :model-value="permissions.adminApproveNewMembers"
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
            <el-button :loading="loading" @click="loadDetail">刷新</el-button>
          </template>
        </el-input>
        <el-alert
          v-if="!detail?.membersAvailable"
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
          <el-table-column type="selection" width="46" />
          <el-table-column prop="name" label="昵称" min-width="120" />
          <el-table-column prop="phone" label="WS号" min-width="150" />
          <el-table-column label="角色" width="110">
            <template #default="{ row }">
              <el-tag size="small">{{ row.roleText || row.role }}</el-tag>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无成员数据" />
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

.member-alert {
  margin: 10px 0;
}
</style>
