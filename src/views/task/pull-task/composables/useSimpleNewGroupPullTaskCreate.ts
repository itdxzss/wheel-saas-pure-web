import { reactive } from "vue";
import {
  createPullTaskSimpleNewGroup,
  uploadPullTaskStandardGroupAvatar,
  type PullTaskSimpleNewGroupCreateRequest,
  type PullTaskStandardGroupAvatarUpload
} from "@/api/pull-task";
import {
  emptyImmediateForm,
  immediateRequestFields,
  positiveId,
  useImmediatePullTaskCreate,
  type ImmediatePullTaskForm,
  type ImmediatePullTaskCreateState
} from "./useImmediatePullTaskCreate";

export interface SimpleNewGroupPullTaskForm extends ImmediatePullTaskForm {
  creatorGroupId: number | "";
  managerGroupId: number | "";
  managerFinishGroupId: number | "";
  creatorDeleteAfterTakeover: boolean;
  groupName: string;
  groupDescription: string;
  pullIntervalMaxSeconds: number;
}

export interface SimpleNewGroupPullTaskCreateState
  extends ImmediatePullTaskCreateState<SimpleNewGroupPullTaskForm> {
  avatar: {
    file: File | null;
    uploaded: PullTaskStandardGroupAvatarUpload | null;
  };
  setAvatar: (file: File) => void;
  clearAvatar: () => void;
}

export function useSimpleNewGroupPullTaskCreate(options: {
  onCreated: () => Promise<void>;
}): SimpleNewGroupPullTaskCreateState {
  const avatar = reactive<SimpleNewGroupPullTaskCreateState["avatar"]>({
    file: null,
    uploaded: null
  });
  const state = useImmediatePullTaskCreate<
    SimpleNewGroupPullTaskForm,
    PullTaskSimpleNewGroupCreateRequest
  >({
    ...options,
    emptyForm: () => ({
      ...emptyImmediateForm(),
      creatorGroupId: "",
      managerGroupId: "",
      managerFinishGroupId: "",
      creatorDeleteAfterTakeover: false,
      groupName: "",
      groupDescription: "",
      earlyPullCallCount: 0,
      pullCountMin: 1,
      pullCountMax: 3,
      pullIntervalSeconds: 10,
      pullIntervalMaxSeconds: 15
    }),
    allowZeroEarlyCalls: true,
    validateForm: form => {
      if (!positiveId(form.creatorGroupId)) return "请选择建群人分组";
      if (!positiveId(form.managerGroupId)) return "请选择管理分组";
      if (!form.groupName.trim()) return "请填写群名称";
      if (form.groupName.trim().length > 100)
        return "群名称不能超过 100 个字符";
      if (form.groupDescription.trim().length > 1024)
        return "群公告不能超过 1024 个字符";
      if (form.pullCountMax > 50)
        return "新群模式单次拉人数必须在 1–50 人范围内";
      if (form.earlyPullCallCount !== 0)
        return "新群模式从首次调用起使用单次拉人数范围";
      if (
        !Number.isInteger(form.pullIntervalMaxSeconds) ||
        !Number.isInteger(form.pullIntervalSeconds) ||
        form.pullIntervalSeconds < 0 ||
        form.pullIntervalMaxSeconds < form.pullIntervalSeconds
      )
        return "拉人间隔必须为非负整数，且上限不能小于下限";
      return "";
    },
    buildRequest: async (form, packageIds) => {
      if (avatar.file && !avatar.uploaded)
        avatar.uploaded = await uploadPullTaskStandardGroupAvatar(avatar.file);
      return {
        ...immediateRequestFields(form, packageIds),
        creatorGroupId: positiveId(form.creatorGroupId)!,
        managerGroupId: positiveId(form.managerGroupId)!,
        managerFinishGroupId: positiveId(form.managerFinishGroupId),
        creatorDeleteAfterTakeover: form.creatorDeleteAfterTakeover,
        groupName: form.groupName.trim(),
        groupDescription: form.groupDescription.trim() || null,
        avatarFileKey: avatar.uploaded?.avatarFileKey ?? null,
        pullIntervalMaxSeconds: form.pullIntervalMaxSeconds
      };
    },
    submit: createPullTaskSimpleNewGroup,
    onReset: () => {
      avatar.file = null;
      avatar.uploaded = null;
    }
  });
  return Object.assign(state, {
    avatar,
    setAvatar(file: File): void {
      const extension = file.name.toLowerCase().match(/\.(jpe?g|png)$/)?.[1];
      const expectedType = extension === "png" ? "image/png" : "image/jpeg";
      if (
        !extension ||
        file.type.toLowerCase() !== expectedType ||
        file.size === 0 ||
        file.size > 500 * 1024
      ) {
        state.error = "请选择不超过 500KB 且非空的 JPG 或 PNG 头像";
        return;
      }
      avatar.file = file;
      avatar.uploaded = null;
      state.error = "";
    },
    clearAvatar(): void {
      avatar.file = null;
      avatar.uploaded = null;
    }
  });
}
