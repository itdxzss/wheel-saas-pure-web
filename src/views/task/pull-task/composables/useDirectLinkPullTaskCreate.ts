import {
  createPullTaskDirectLink,
  type PullTaskDirectLinkCreateRequest
} from "@/api/pull-task";
import {
  emptyImmediateForm,
  immediateRequestFields,
  positiveId,
  useImmediatePullTaskCreate,
  type ImmediatePullTaskForm,
  type ImmediatePullTaskCreateState
} from "./useImmediatePullTaskCreate";

export interface DirectLinkPullTaskForm extends ImmediatePullTaskForm {
  groupFolderId: number | "";
  linksText: string;
}
export type DirectLinkPullTaskCreateState =
  ImmediatePullTaskCreateState<DirectLinkPullTaskForm>;

export function useDirectLinkPullTaskCreate(options: {
  onCreated: () => Promise<void>;
}): DirectLinkPullTaskCreateState {
  return useImmediatePullTaskCreate<
    DirectLinkPullTaskForm,
    PullTaskDirectLinkCreateRequest
  >({
    ...options,
    emptyForm: () => ({
      ...emptyImmediateForm(),
      groupFolderId: "",
      linksText: ""
    }),
    loadFolders: true,
    validateForm: form =>
      !positiveId(form.groupFolderId) && !form.linksText.trim()
        ? "请选择群组分组或粘贴群链接"
        : "",
    buildRequest: async (form, packageIds) => ({
      ...immediateRequestFields(form, packageIds),
      groupFolderId: positiveId(form.groupFolderId),
      linksText: form.linksText.trim()
    }),
    submit: createPullTaskDirectLink
  });
}
