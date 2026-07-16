import { ref, type Ref } from "vue";
import { ElMessage } from "element-plus";
import { updateTimedMessage, type TimedMessageMode } from "@/api/group";
import { apiErrorMessage } from "@/utils/api-error";

interface GroupTimedMessageOptions {
  groupId: () => number | null;
  reload: () => Promise<void>;
}

interface GroupTimedMessageState {
  changeMode: (mode: TimedMessageMode) => Promise<void>;
  mode: Ref<TimedMessageMode | null>;
  reset: () => void;
  saving: Ref<boolean>;
  setMode: (mode: TimedMessageMode | null) => void;
}

export function useGroupTimedMessage(
  options: GroupTimedMessageOptions
): GroupTimedMessageState {
  const mode = ref<TimedMessageMode | null>(null);
  const confirmedMode = ref<TimedMessageMode | null>(null);
  const saving = ref(false);

  function setMode(value: TimedMessageMode | null): void {
    mode.value = value;
    confirmedMode.value = value;
  }

  function reset(): void {
    setMode(null);
    saving.value = false;
  }

  async function changeMode(value: TimedMessageMode): Promise<void> {
    const groupId = options.groupId();
    if (groupId == null || saving.value) return;
    mode.value = value;
    saving.value = true;
    try {
      await updateTimedMessage(groupId, value);
    } catch (error) {
      mode.value = confirmedMode.value;
      ElMessage.error(apiErrorMessage(error, "限时消息设置失败"));
      saving.value = false;
      return;
    }
    confirmedMode.value = value;
    ElMessage.success("限时消息已更新");
    await options.reload();
    saving.value = false;
  }

  return { changeMode, mode, reset, saving, setMode };
}
