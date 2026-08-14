import { reactive, ref, watch, type Ref } from "vue";
import { ElMessage } from "element-plus";
import {
  clearPullTaskStandardDraft,
  createPullTaskStandard,
  deletePullTaskStandardGroupAvatar,
  getPullTaskStandardDraft,
  planPullTaskStandardDraft,
  removePullTaskStandardDraftRow,
  type PullTaskStandardCreateRequest,
  type PullTaskStandardDraft,
  type PullTaskStandardGroupAvatarUpload,
  uploadPullTaskStandardGroupAvatar
} from "@/api/pull-task";
import {
  listAccountGroups,
  type AccountGroupApiRow
} from "@/api/account-group";
import { listGroupFolders, type GroupFolderRow } from "@/api/group-folder";
import { apiErrorMessage } from "@/utils/api-error";

const LINKS_STORAGE_KEY = "pull-task-standard-normal-link-links";
const PLANNED_LINKS_STORAGE_KEY =
  "pull-task-standard-normal-link-planned-links";

export interface StandardPullTaskCreateForm {
  taskName: string;
  remark: string;
  autoStart: boolean;
  groupFolderId: number | "";
  materialAdminTiming: 1 | 2;
  pullerSyncMode: "SINGLE" | "BATCH";
  clearExistingMembers: boolean;
  pullerJoinByLink: boolean;
  earlyPullCount: number;
  earlyPullCallCount: number;
  pullCountMin: number;
  pullCountMax: number;
  pullIntervalSeconds: number;
  pullerCountPerGroup: number;
  stationCountPerCall: number;
  concurrentGroupCount: number;
  managerGroupId: number | "";
  pullerGroupId: number | "";
  stationGroupId: number | "";
  managerFinishGroupId: number | "";
  pullerFinishGroupId: number | "";
  groupSettingTiming: "BEFORE_PULL" | "AFTER_PULL";
  groupName: string;
  useMaterialFileNameAsGroupName: boolean;
  groupDescription: string;
  autoCloseMuteAfterTask: boolean;
  autoCloseInviteAfterTask: boolean;
  editPermission: "UNCHANGED" | "ALLOW" | "DISALLOW";
  muteMode: "UNCHANGED" | "MUTE" | "UNMUTE";
  linkPermission: "ALL" | "ADMIN_ONLY";
  disappearingMessage:
    | "ONE_DAY"
    | "SEVEN_DAYS"
    | "NINETY_DAYS"
    | "OFF"
    | "UNCHANGED";
}

export interface StandardPullTaskCreateOptions {
  onCreated: () => Promise<void>;
}

export interface StandardPullTaskCreateState {
  visible: Ref<boolean>;
  loading: Ref<boolean>;
  planning: Ref<boolean>;
  creating: Ref<boolean>;
  clearing: Ref<boolean>;
  form: StandardPullTaskCreateForm;
  linksText: Ref<string>;
  draft: Ref<PullTaskStandardDraft>;
  accountGroups: Ref<AccountGroupApiRow[]>;
  groupFolders: Ref<GroupFolderRow[]>;
  pendingFiles: Ref<File[]>;
  groupAvatarFile: Ref<File | null>;
  uploadedAvatar: Ref<PullTaskStandardGroupAvatarUpload | null>;
  open: () => Promise<void>;
  addFiles: (files: File[]) => void;
  movePendingFile: (fileName: string, offset: -1 | 1) => void;
  removePendingFile: (fileName: string) => void;
  setGroupAvatarFile: (file: File) => Promise<void>;
  clearGroupAvatar: () => Promise<void>;
  plan: () => Promise<boolean>;
  removeRow: (rowId: number) => Promise<void>;
  clear: () => Promise<void>;
  create: () => Promise<void>;
}

function emptyForm(): StandardPullTaskCreateForm {
  return {
    taskName: `任务_${Date.now().toString().slice(-8)}`,
    remark: "",
    autoStart: true,
    groupFolderId: "",
    materialAdminTiming: 2,
    pullerSyncMode: "SINGLE",
    clearExistingMembers: false,
    pullerJoinByLink: false,
    earlyPullCount: 1,
    earlyPullCallCount: 2,
    pullCountMin: 50,
    pullCountMax: 50,
    pullIntervalSeconds: 15,
    pullerCountPerGroup: 2,
    stationCountPerCall: 0,
    concurrentGroupCount: 1,
    managerGroupId: "",
    pullerGroupId: "",
    stationGroupId: "",
    managerFinishGroupId: "",
    pullerFinishGroupId: "",
    groupSettingTiming: "AFTER_PULL",
    groupName: "",
    useMaterialFileNameAsGroupName: false,
    groupDescription: "",
    autoCloseMuteAfterTask: false,
    autoCloseInviteAfterTask: false,
    editPermission: "UNCHANGED",
    muteMode: "UNCHANGED",
    linkPermission: "ADMIN_ONLY",
    disappearingMessage: "UNCHANGED"
  };
}

function emptyDraft(): PullTaskStandardDraft {
  return {
    draftTaskId: null,
    rows: [],
    linkLines: [],
    fileResults: [],
    matchedCount: 0,
    remainingLinkCount: 0,
    ignoredFileCount: 0
  };
}

function storedLinks(): string {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(LINKS_STORAGE_KEY) ?? "";
}

function storeLinks(value: string): void {
  if (typeof window === "undefined") return;
  if (value) {
    window.sessionStorage.setItem(LINKS_STORAGE_KEY, value);
    return;
  }
  window.sessionStorage.removeItem(LINKS_STORAGE_KEY);
}

function storedPlannedLinks(): string {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(PLANNED_LINKS_STORAGE_KEY) ?? "";
}

function storePlannedLinks(value: string): void {
  if (typeof window === "undefined") return;
  if (value) {
    window.sessionStorage.setItem(PLANNED_LINKS_STORAGE_KEY, value);
    return;
  }
  window.sessionStorage.removeItem(PLANNED_LINKS_STORAGE_KEY);
}

function withoutFrozenLink(
  text: string,
  lineNo: number,
  normalizedLink: string
): string {
  const lines = text.split(/\r?\n/);
  const inviteCode = normalizedLink.split("/").at(-1) ?? normalizedLink;
  const sourceIndex = lineNo - 1;
  const removalIndex = lines[sourceIndex]?.includes(inviteCode)
    ? sourceIndex
    : lines.findIndex(line => line.includes(inviteCode));
  if (removalIndex >= 0) lines.splice(removalIndex, 1);
  return lines.join("\n");
}

function positiveId(value: number | ""): value is number {
  return typeof value === "number" && value > 0;
}

export function useStandardPullTaskCreate(
  options: StandardPullTaskCreateOptions
): StandardPullTaskCreateState {
  const visible = ref(false);
  const loading = ref(false);
  const planning = ref(false);
  const creating = ref(false);
  const clearing = ref(false);
  const form = reactive<StandardPullTaskCreateForm>(emptyForm());
  const linksText = ref(storedLinks());
  const draft = ref<PullTaskStandardDraft>(emptyDraft());
  const accountGroups = ref<AccountGroupApiRow[]>([]);
  const groupFolders = ref<GroupFolderRow[]>([]);
  const pendingFiles = ref<File[]>([]);
  const groupAvatarFile = ref<File | null>(null);
  const uploadedAvatar = ref<PullTaskStandardGroupAvatarUpload | null>(null);
  let plannedLinksText = storedPlannedLinks();
  let plannedPendingNames = new Set<string>();
  let plannedGroupFolderId: number | null = null;

  watch(linksText, value => storeLinks(value));

  async function open(): Promise<void> {
    visible.value = true;
    loading.value = true;
    try {
      const [accountResult, folderResult, draftResult] =
        await Promise.allSettled([
          listAccountGroups({ page: 1, pageSize: 500 }),
          listGroupFolders({ page: 1, pageSize: 500 }),
          getPullTaskStandardDraft()
        ]);
      if (accountResult.status === "fulfilled") {
        accountGroups.value = accountResult.value.list ?? [];
      } else {
        accountGroups.value = [];
        ElMessage.error(
          apiErrorMessage(accountResult.reason, "账号分组加载失败")
        );
      }
      if (folderResult.status === "fulfilled") {
        groupFolders.value = folderResult.value.list ?? [];
      } else {
        groupFolders.value = [];
        ElMessage.error(
          apiErrorMessage(folderResult.reason, "群组分组加载失败")
        );
      }
      if (draftResult.status === "fulfilled") {
        draft.value = draftResult.value;
      } else {
        ElMessage.error(apiErrorMessage(draftResult.reason, "草稿加载失败"));
      }
    } finally {
      loading.value = false;
    }
  }

  function addFiles(files: File[]): void {
    const knownNames = new Set([
      ...pendingFiles.value.map(file => file.name),
      ...draft.value.rows.map(row => row.sourceFileName)
    ]);
    files.forEach(file => {
      if (!file.name.toLowerCase().endsWith(".txt")) {
        ElMessage.warning(`${file.name} 不是 TXT 文件，已忽略`);
        return;
      }
      if (knownNames.has(file.name)) {
        ElMessage.warning(`${file.name} 已添加，请勿重复上传同名文件`);
        return;
      }
      knownNames.add(file.name);
      pendingFiles.value.push(file);
    });
  }

  function removePendingFile(fileName: string): void {
    pendingFiles.value = pendingFiles.value.filter(
      file => file.name !== fileName
    );
  }

  function movePendingFile(fileName: string, offset: -1 | 1): void {
    const sourceIndex = pendingFiles.value.findIndex(
      file => file.name === fileName
    );
    const targetIndex = sourceIndex + offset;
    if (
      sourceIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= pendingFiles.value.length
    ) {
      return;
    }
    const nextFiles = [...pendingFiles.value];
    const [movingFile] = nextFiles.splice(sourceIndex, 1);
    if (!movingFile) return;
    nextFiles.splice(targetIndex, 0, movingFile);
    pendingFiles.value = nextFiles;
  }

  function validAvatar(file: File): boolean {
    const extension = file.name.toLowerCase().match(/\.(jpe?g|png)$/)?.[1];
    const expectedType = extension === "png" ? "image/png" : "image/jpeg";
    if (!extension || file.type.toLowerCase() !== expectedType) {
      ElMessage.warning("群头像仅支持 JPG、JPEG、PNG 格式");
      return false;
    }
    if (file.size < 1 || file.size > 512_000) {
      ElMessage.warning("群头像大小不能超过 500K，且不能为空文件");
      return false;
    }
    return true;
  }

  async function discardUploadedAvatar(): Promise<boolean> {
    const avatar = uploadedAvatar.value;
    if (!avatar) return true;
    try {
      await deletePullTaskStandardGroupAvatar(avatar.avatarFileKey);
      uploadedAvatar.value = null;
      return true;
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "已上传头像清理失败"));
      return false;
    }
  }

  async function setGroupAvatarFile(file: File): Promise<void> {
    if (!validAvatar(file)) return;
    if (!(await discardUploadedAvatar())) return;
    groupAvatarFile.value = file;
  }

  async function clearGroupAvatar(): Promise<void> {
    if (!(await discardUploadedAvatar())) return;
    groupAvatarFile.value = null;
  }

  function reconcilePendingFiles(result: PullTaskStandardDraft): void {
    const matchedNames = new Set(result.rows.map(row => row.sourceFileName));
    const rejectedNames = new Set(
      result.fileResults
        .filter(fileResult => !fileResult.accepted)
        .map(fileResult => fileResult.fileName)
    );
    pendingFiles.value = pendingFiles.value.filter(
      file => !matchedNames.has(file.name) && !rejectedNames.has(file.name)
    );
  }

  function currentGroupFolderId(): number | null {
    return positiveId(form.groupFolderId) ? form.groupFolderId : null;
  }

  function hasGroupSource(): boolean {
    return currentGroupFolderId() !== null || Boolean(linksText.value.trim());
  }

  function resourcePlanChanged(): boolean {
    return (
      linksText.value !== plannedLinksText ||
      currentGroupFolderId() !== plannedGroupFolderId ||
      pendingFiles.value.length !== plannedPendingNames.size ||
      pendingFiles.value.some(file => !plannedPendingNames.has(file.name))
    );
  }

  async function plan(): Promise<boolean> {
    const groupFolderId = currentGroupFolderId();
    if (!hasGroupSource()) {
      ElMessage.warning("请选择群组分组或粘贴群链接");
      return false;
    }
    planning.value = true;
    try {
      const result = await planPullTaskStandardDraft(
        groupFolderId,
        linksText.value,
        pendingFiles.value
      );
      draft.value = result;
      reconcilePendingFiles(result);
      plannedLinksText = linksText.value;
      plannedPendingNames = new Set(pendingFiles.value.map(file => file.name));
      plannedGroupFolderId = groupFolderId;
      storePlannedLinks(plannedLinksText);
      ElMessage.success("执行计划已生成");
      return true;
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "执行计划生成失败"));
      return false;
    } finally {
      planning.value = false;
    }
  }

  async function removeRow(rowId: number): Promise<void> {
    const removedRow = draft.value.rows.find(row => row.rowId === rowId);
    const nextLinksText = removedRow
      ? withoutFrozenLink(
          linksText.value,
          removedRow.sourceLinkLineNo,
          removedRow.normalizedLink
        )
      : linksText.value;
    try {
      draft.value = await removePullTaskStandardDraftRow(rowId);
      linksText.value = nextLinksText;
      plannedLinksText = nextLinksText;
      storePlannedLinks(plannedLinksText);
      ElMessage.success("执行行已移除");
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "执行行移除失败"));
    }
  }

  async function clear(): Promise<void> {
    clearing.value = true;
    try {
      draft.value = await clearPullTaskStandardDraft();
      linksText.value = "";
      pendingFiles.value = [];
      plannedLinksText = "";
      plannedPendingNames = new Set();
      plannedGroupFolderId = null;
      storePlannedLinks("");
      ElMessage.success("创建草稿已清空");
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "创建草稿清空失败"));
    } finally {
      clearing.value = false;
    }
  }

  function createPayload(
    avatarFileKey: string | null
  ): PullTaskStandardCreateRequest | null {
    if (!form.taskName.trim()) {
      ElMessage.warning("请填写任务名称");
      return null;
    }
    if (draft.value.draftTaskId === null || draft.value.rows.length === 0) {
      ElMessage.warning("未生成可执行计划，请检查群来源和 TXT 料子");
      return null;
    }
    if (!positiveId(form.managerGroupId) || !positiveId(form.pullerGroupId)) {
      ElMessage.warning("请选择管理和拉手分组");
      return null;
    }
    if (form.stationCountPerCall > 0 && !positiveId(form.stationGroupId)) {
      ElMessage.warning("请选择站台分组");
      return null;
    }
    if (form.pullCountMin < 1 || form.pullCountMax < form.pullCountMin) {
      ElMessage.warning("单次拉人数范围配置不正确");
      return null;
    }
    if (form.earlyPullCount < 1 || form.earlyPullCallCount < 1) {
      ElMessage.warning("前期拉人人数或执行次数配置不正确");
      return null;
    }
    return {
      draftTaskId: draft.value.draftTaskId,
      taskName: form.taskName.trim(),
      remark: form.remark.trim() || null,
      autoStart: form.autoStart ? 1 : 0,
      groupFolderId: currentGroupFolderId(),
      pullerSyncMode: form.pullerSyncMode,
      materialAdminTiming: form.materialAdminTiming,
      clearExistingMembers: form.clearExistingMembers,
      pullerJoinByLink: form.pullerJoinByLink,
      earlyPullCount: form.earlyPullCount,
      earlyPullCallCount: form.earlyPullCallCount,
      pullCountMin: form.pullCountMin,
      pullCountMax: form.pullCountMax,
      pullIntervalSeconds: form.pullIntervalSeconds,
      pullerCountPerGroup: form.pullerCountPerGroup,
      stationCountPerCall: form.stationCountPerCall,
      concurrentGroupCount: form.concurrentGroupCount,
      managerGroupId: form.managerGroupId,
      pullerGroupId: form.pullerGroupId,
      stationGroupId: positiveId(form.stationGroupId)
        ? form.stationGroupId
        : null,
      managerFinishGroupId: positiveId(form.managerFinishGroupId)
        ? form.managerFinishGroupId
        : null,
      pullerFinishGroupId: positiveId(form.pullerFinishGroupId)
        ? form.pullerFinishGroupId
        : null,
      groupSetting: {
        settingTiming: form.groupSettingTiming,
        groupName: form.useMaterialFileNameAsGroupName
          ? null
          : form.groupName.trim() || null,
        useMaterialFileNameAsGroupName: form.useMaterialFileNameAsGroupName,
        avatarFileKey,
        groupDescription: form.groupDescription.trim() || null,
        autoCloseMuteAfterTask: form.autoCloseMuteAfterTask,
        autoCloseInviteAfterTask: form.autoCloseInviteAfterTask,
        editPermission: form.editPermission,
        muteMode: form.muteMode,
        linkPermission: form.linkPermission,
        disappearingMessage: form.disappearingMessage
      }
    };
  }

  async function ensureAvatarUploaded(): Promise<string | null> {
    if (uploadedAvatar.value) return uploadedAvatar.value.avatarFileKey;
    if (!groupAvatarFile.value) return null;
    uploadedAvatar.value = await uploadPullTaskStandardGroupAvatar(
      groupAvatarFile.value
    );
    return uploadedAvatar.value.avatarFileKey;
  }

  async function ensureExecutionPlan(): Promise<boolean> {
    const hasExecutionRows = draft.value.rows.length > 0;
    if (!hasExecutionRows && !hasGroupSource()) {
      ElMessage.warning("请选择群组分组或粘贴群链接");
      return false;
    }
    if (!hasExecutionRows && pendingFiles.value.length === 0) {
      ElMessage.warning("请上传 TXT 料子文件");
      return false;
    }
    if (!hasExecutionRows || resourcePlanChanged()) {
      if (!(await plan())) return false;
    }
    if (draft.value.rows.length === 0) {
      ElMessage.warning("未生成可执行计划，请检查群来源和 TXT 料子");
      return false;
    }
    return true;
  }

  async function create(): Promise<void> {
    if (!(await ensureExecutionPlan())) return;
    if (!createPayload(uploadedAvatar.value?.avatarFileKey ?? null)) return;
    creating.value = true;
    try {
      const avatarFileKey = await ensureAvatarUploaded();
      const payload = createPayload(avatarFileKey);
      if (!payload) return;
      await createPullTaskStandard(payload);
      visible.value = false;
      draft.value = emptyDraft();
      linksText.value = "";
      pendingFiles.value = [];
      plannedLinksText = "";
      plannedPendingNames = new Set();
      plannedGroupFolderId = null;
      groupAvatarFile.value = null;
      uploadedAvatar.value = null;
      storePlannedLinks("");
      Object.assign(form, emptyForm());
      ElMessage.success("普通群链接任务已创建");
      await options.onCreated();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "普通群链接任务创建失败"));
    } finally {
      creating.value = false;
    }
  }

  return {
    visible,
    loading,
    planning,
    creating,
    clearing,
    form,
    linksText,
    draft,
    accountGroups,
    groupFolders,
    pendingFiles,
    groupAvatarFile,
    uploadedAvatar,
    open,
    addFiles,
    movePendingFile,
    removePendingFile,
    setGroupAvatarFile,
    clearGroupAvatar,
    plan,
    removeRow,
    clear,
    create
  };
}
