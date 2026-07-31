import { ref, type Ref } from "vue";
import { ElMessage } from "element-plus";
import { getPullTaskGroupMarketingSetting } from "@/api/pull-task";
import { apiErrorMessage } from "@/utils/api-error";
import type { PullTaskMarketingCreateDraft } from "./create-draft";
import { validateCreateSetting } from "./create-interactions";

export interface PullTaskCreateSettingState {
  configured: Ref<boolean>;
  loading: Ref<boolean>;
  load: () => Promise<void>;
  validate: () => string | null;
}

function clearSetting(draft: PullTaskMarketingCreateDraft): void {
  draft.marketingSilenceMinutes = null;
  draft.groupLockdownMinutes = null;
  draft.maxMarketingAccountsPerGroup = null;
  draft.globalMaxMarketingAccountsPerGroup = null;
}

export function usePullTaskCreateSetting(
  draft: Ref<PullTaskMarketingCreateDraft>
): PullTaskCreateSettingState {
  const configured = ref(false);
  const loading = ref(false);

  async function load(): Promise<void> {
    configured.value = false;
    loading.value = true;
    clearSetting(draft.value);
    try {
      const setting = await getPullTaskGroupMarketingSetting();
      if (
        setting.configured &&
        setting.marketingSilenceMinutes != null &&
        setting.groupLockdownMinutes != null &&
        setting.maxMarketingAccountsPerGroup != null
      ) {
        draft.value.marketingSilenceMinutes = setting.marketingSilenceMinutes;
        draft.value.groupLockdownMinutes = setting.groupLockdownMinutes;
        draft.value.maxMarketingAccountsPerGroup =
          setting.maxMarketingAccountsPerGroup;
        draft.value.globalMaxMarketingAccountsPerGroup =
          setting.maxMarketingAccountsPerGroup;
        configured.value = true;
      }
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "拉群营销全局设置加载失败"));
    } finally {
      loading.value = false;
    }
  }

  function validate(): string | null {
    return validateCreateSetting(draft.value);
  }

  return { configured, loading, load, validate };
}
