import { computed, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  executeGroupCreatorLeave,
  getGroupCreatorLeaveCapability,
  type GroupCreatorLeaveCapability
} from "@/api/group";
import { apiErrorMessage } from "@/utils/api-error";

interface GroupCreatorLeaveOptions {
  groupId: () => number | null;
  active: () => boolean;
  onSuccess: () => void;
}

/** 群详情抽屉的群主退群能力读取与确认交互。 */
export function useGroupCreatorLeave(options: GroupCreatorLeaveOptions) {
  const capability = ref<GroupCreatorLeaveCapability | null>(null);
  const capabilityLoading = ref(false);
  const creatorLeaving = ref(false);
  let loadSession = 0;

  const creatorLeaveExecutable = computed(
    () => capability.value?.executable === true && !creatorLeaving.value
  );
  const creatorLeaveReason = computed(
    () => capability.value?.blockedReason || "当前条件不允许群主退群"
  );

  function resetCreatorLeave(): void {
    loadSession += 1;
    capability.value = null;
    capabilityLoading.value = false;
    creatorLeaving.value = false;
  }

  async function loadCreatorLeaveCapability(): Promise<void> {
    const groupId = options.groupId();
    if (groupId === null || !options.active()) return;
    const session = ++loadSession;
    capability.value = null;
    capabilityLoading.value = true;
    try {
      const loaded = await getGroupCreatorLeaveCapability(groupId);
      if (
        session === loadSession &&
        options.active() &&
        options.groupId() === groupId
      ) {
        capability.value = loaded;
      }
    } catch (error) {
      if (session !== loadSession || options.groupId() !== groupId) return;
      capability.value = {
        executable: false,
        blockedReasonCode: "LOAD_FAILED",
        blockedReason: apiErrorMessage(error, "群主退群条件读取失败")
      };
    } finally {
      if (session === loadSession) capabilityLoading.value = false;
    }
  }

  async function runCreatorLeave(): Promise<void> {
    const groupId = options.groupId();
    if (groupId === null || !creatorLeaveExecutable.value) {
      ElMessage.warning(creatorLeaveReason.value);
      return;
    }
    try {
      await ElMessageBox.confirm(
        "群内已有我方控端管理员时，建群者将直接退出；否则先把一个正常控端普通成员设为管理员，再执行退群。确认继续吗？",
        "群主退群确认",
        {
          type: "warning",
          confirmButtonText: "确认退群",
          cancelButtonText: "取消"
        }
      );
    } catch {
      return;
    }

    creatorLeaving.value = true;
    try {
      const result = await executeGroupCreatorLeave(groupId);
      if (!options.active() || options.groupId() !== groupId) return;
      if (result.status === "SUCCESS") {
        capability.value = {
          executable: false,
          blockedReasonCode: "LEAVE_SUBMITTED",
          blockedReason: "群主退群已提交"
        };
        ElMessage.success(result.message || "群主退群成功");
        options.onSuccess();
      } else {
        ElMessage.warning(result.message || "群主退群未完成");
      }
    } catch (error) {
      if (options.active() && options.groupId() === groupId) {
        ElMessage.error(apiErrorMessage(error, "群主退群失败"));
      }
    } finally {
      creatorLeaving.value = false;
    }
  }

  return {
    capabilityLoading,
    creatorLeaveExecutable,
    creatorLeaveReason,
    creatorLeaving,
    loadCreatorLeaveCapability,
    resetCreatorLeave,
    runCreatorLeave
  };
}
