import { reactive, ref, type Ref } from "vue";
import { ElMessage } from "element-plus";
import {
  getPullTaskGroupMarketingSetting,
  updatePullTaskGroupMarketingSetting
} from "@/api/pull-task";
import { apiErrorMessage } from "@/utils/api-error";

export interface PullTaskGlobalSettingForm {
  marketingSilenceMinutes: number | null;
  groupLockdownMinutes: number | null;
  maxMarketingAccountsPerGroup: number | null;
}

export interface PullTaskGlobalSettingState {
  visible: Ref<boolean>;
  loading: Ref<boolean>;
  saving: Ref<boolean>;
  form: PullTaskGlobalSettingForm;
  open: () => Promise<void>;
  cancel: () => void;
  save: () => Promise<void>;
}

function resetForm(form: PullTaskGlobalSettingForm): void {
  form.marketingSilenceMinutes = null;
  form.groupLockdownMinutes = null;
  form.maxMarketingAccountsPerGroup = null;
}

function validationMessage(form: PullTaskGlobalSettingForm): string | null {
  if (
    !Number.isInteger(form.marketingSilenceMinutes) ||
    (form.marketingSilenceMinutes ?? -1) < 0
  ) {
    return "营销静默时间必须为大于等于0的整数";
  }
  if (
    !Number.isInteger(form.groupLockdownMinutes) ||
    (form.groupLockdownMinutes ?? -1) < 0
  ) {
    return "群组封控时间必须为大于等于0的整数";
  }
  if (
    !Number.isInteger(form.maxMarketingAccountsPerGroup) ||
    (form.maxMarketingAccountsPerGroup ?? 0) < 1
  ) {
    return "单群营销账号上限必须为大于等于1的整数";
  }
  return null;
}

export function usePullTaskGlobalSetting(): PullTaskGlobalSettingState {
  const visible = ref(false);
  const loading = ref(false);
  const saving = ref(false);
  const form = reactive<PullTaskGlobalSettingForm>({
    marketingSilenceMinutes: null,
    groupLockdownMinutes: null,
    maxMarketingAccountsPerGroup: null
  });

  async function open(): Promise<void> {
    visible.value = true;
    loading.value = true;
    resetForm(form);
    try {
      const setting = await getPullTaskGroupMarketingSetting();
      if (setting.configured) {
        form.marketingSilenceMinutes = setting.marketingSilenceMinutes;
        form.groupLockdownMinutes = setting.groupLockdownMinutes;
        form.maxMarketingAccountsPerGroup =
          setting.maxMarketingAccountsPerGroup;
      }
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "全局设置加载失败"));
    } finally {
      loading.value = false;
    }
  }

  function cancel(): void {
    visible.value = false;
  }

  async function save(): Promise<void> {
    const invalidMessage = validationMessage(form);
    if (invalidMessage) {
      ElMessage.warning(invalidMessage);
      return;
    }
    saving.value = true;
    try {
      await updatePullTaskGroupMarketingSetting({
        marketingSilenceMinutes: form.marketingSilenceMinutes as number,
        groupLockdownMinutes: form.groupLockdownMinutes as number,
        maxMarketingAccountsPerGroup:
          form.maxMarketingAccountsPerGroup as number
      });
      visible.value = false;
      ElMessage.success("全局设置已保存");
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "全局设置保存失败"));
    } finally {
      saving.value = false;
    }
  }

  return { visible, loading, saving, form, open, cancel, save };
}
