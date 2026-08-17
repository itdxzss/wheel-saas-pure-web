import { reactive, ref, type Ref } from "vue";
import { ElMessage } from "element-plus";
import {
  updateGroupSetting,
  type GroupPermissionKey,
  type GroupPermissionState
} from "@/api/group";
import { apiErrorMessage } from "@/utils/api-error";

type GroupPermissionField = keyof GroupPermissionState;

const PERMISSION_KEYS: Record<GroupPermissionField, GroupPermissionKey> = {
  editGroupSettings: "EDIT_GROUP_SETTINGS",
  sendMessages: "SEND_MESSAGES",
  addMembers: "ADD_MEMBERS",
  inviteViaLink: "INVITE_VIA_LINK",
  adminApproveNewMembers: "ADMIN_APPROVE_NEW_MEMBERS"
};

interface GroupPermissionOptions {
  groupId: () => number | null;
  reload: () => Promise<void>;
  refreshAfterSubmit?: () => Promise<void>;
}

interface GroupPermissionsState {
  permissions: GroupPermissionState;
  reset: () => void;
  saving: Ref<boolean>;
  setPermissions: (value: GroupPermissionState) => void;
  toggle: (field: GroupPermissionField, value?: boolean) => Promise<void>;
}

export function emptyGroupPermissions(): GroupPermissionState {
  return {
    editGroupSettings: null,
    sendMessages: null,
    addMembers: null,
    inviteViaLink: null,
    adminApproveNewMembers: null
  };
}

export function useGroupPermissions(
  options: GroupPermissionOptions
): GroupPermissionsState {
  const permissions = reactive<GroupPermissionState>(emptyGroupPermissions());
  const saving = ref(false);

  function setPermissions(value: GroupPermissionState): void {
    Object.assign(permissions, value);
  }

  function reset(): void {
    setPermissions(emptyGroupPermissions());
    saving.value = false;
  }

  async function toggle(
    field: GroupPermissionField,
    requestedValue?: boolean
  ): Promise<void> {
    const groupId = options.groupId();
    const previous = permissions[field];
    if (groupId == null || saving.value) return;
    const enabled = requestedValue ?? (previous == null ? true : !previous);
    permissions[field] = enabled;
    saving.value = true;
    try {
      await updateGroupSetting(groupId, PERMISSION_KEYS[field], enabled);
    } catch (error) {
      permissions[field] = previous;
      ElMessage.error(apiErrorMessage(error, "群组权限更新失败"));
      saving.value = false;
      return;
    }
    ElMessage.success("群组权限设置已提交，后台正在刷新群信息");
    if (options.refreshAfterSubmit) {
      void options.refreshAfterSubmit().catch(error => {
        ElMessage.warning(
          apiErrorMessage(error, "群信息同步未完成，请手动刷新")
        );
      });
    } else {
      try {
        await options.reload();
        // 协议层旧数据可能仍未返回该权限，保留本次已提交的写入结果，避免开关回弹。
        if (permissions[field] == null) {
          permissions[field] = enabled;
        }
      } catch (error) {
        ElMessage.warning(apiErrorMessage(error, "群信息刷新失败，请手动刷新"));
      }
    }
    saving.value = false;
  }

  return { permissions, reset, saving, setPermissions, toggle };
}
