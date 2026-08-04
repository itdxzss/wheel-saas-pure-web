import { reactive, ref, watch, type Ref } from "vue";
import { ElMessage } from "element-plus";
import {
  clearPullTaskStandardDraft,
  createPullTaskStandard,
  getPullTaskStandardDraft,
  planPullTaskStandardDraft,
  removePullTaskStandardDraftRow,
  type PullTaskStandardCreateRequest,
  type PullTaskStandardDraft
} from "@/api/pull-task";
import {
  listAccountGroups,
  type AccountGroupApiRow
} from "@/api/account-group";
import { apiErrorMessage } from "@/utils/api-error";

const LINKS_STORAGE_KEY = "pull-task-standard-normal-link-links";
const PLANNED_LINKS_STORAGE_KEY =
  "pull-task-standard-normal-link-planned-links";

export interface StandardPullTaskCreateForm {
  taskName: string;
  remark: string;
  autoStart: boolean;
  materialAdminTiming: 1 | 2;
  pullCountMin: number;
  pullCountMax: number;
  pullIntervalSeconds: number;
  pullerCountPerGroup: number;
  stationCountPerCall: number;
  concurrentGroupCount: number;
  pullerRiskMinutes: number;
  managerGroupId: number | "";
  pullerGroupId: number | "";
  stationGroupId: number | "";
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
  pendingFiles: Ref<File[]>;
  open: () => Promise<void>;
  addFiles: (files: File[]) => void;
  movePendingFile: (fileName: string, offset: -1 | 1) => void;
  removePendingFile: (fileName: string) => void;
  plan: () => Promise<void>;
  removeRow: (rowId: number) => Promise<void>;
  clear: () => Promise<void>;
  create: () => Promise<void>;
}

function emptyForm(): StandardPullTaskCreateForm {
  return {
    taskName: "",
    remark: "",
    autoStart: false,
    materialAdminTiming: 1,
    pullCountMin: 3,
    pullCountMax: 5,
    pullIntervalSeconds: 6,
    pullerCountPerGroup: 1,
    stationCountPerCall: 0,
    concurrentGroupCount: 1,
    pullerRiskMinutes: 0,
    managerGroupId: "",
    pullerGroupId: "",
    stationGroupId: ""
  };
}

function emptyDraft(): PullTaskStandardDraft {
  return {
    draftTaskId: null,
    version: null,
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
  const pendingFiles = ref<File[]>([]);
  let plannedLinksText = storedPlannedLinks();
  let plannedPendingNames = new Set<string>();

  watch(linksText, value => storeLinks(value));

  async function open(): Promise<void> {
    visible.value = true;
    loading.value = true;
    try {
      const [accountResult, draftResult] = await Promise.allSettled([
        listAccountGroups({ page: 1, pageSize: 500 }),
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

  async function plan(): Promise<void> {
    if (!linksText.value.trim() && pendingFiles.value.length === 0) {
      ElMessage.warning("请粘贴群链接或选择 TXT 文件");
      return;
    }
    planning.value = true;
    try {
      const result = await planPullTaskStandardDraft(
        linksText.value,
        pendingFiles.value
      );
      draft.value = result;
      reconcilePendingFiles(result);
      plannedLinksText = linksText.value;
      plannedPendingNames = new Set(pendingFiles.value.map(file => file.name));
      storePlannedLinks(plannedLinksText);
      ElMessage.success("链接与 TXT 预检完成");
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "链接与 TXT 预检失败"));
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
      storePlannedLinks("");
      ElMessage.success("创建草稿已清空");
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "创建草稿清空失败"));
    } finally {
      clearing.value = false;
    }
  }

  function createPayload(): PullTaskStandardCreateRequest | null {
    if (!form.taskName.trim()) {
      ElMessage.warning("请填写任务名称");
      return null;
    }
    if (
      draft.value.draftTaskId === null ||
      draft.value.version === null ||
      draft.value.rows.length === 0
    ) {
      ElMessage.warning("请先完成链接与 TXT 匹配预览");
      return null;
    }
    if (draft.value.remainingLinkCount > 0) {
      ElMessage.warning("仍有群链接未匹配 TXT，请补充文件或调整链接");
      return null;
    }
    if (
      linksText.value !== plannedLinksText ||
      pendingFiles.value.some(file => !plannedPendingNames.has(file.name))
    ) {
      ElMessage.warning("资源内容已变化，请重新预检并冻结执行计划");
      return null;
    }
    if (
      !positiveId(form.managerGroupId) ||
      !positiveId(form.pullerGroupId) ||
      !positiveId(form.stationGroupId)
    ) {
      ElMessage.warning("请选择管理、拉手和站台分组");
      return null;
    }
    if (form.pullCountMin < 1 || form.pullCountMax < form.pullCountMin) {
      ElMessage.warning("单次拉人数范围配置不正确");
      return null;
    }
    return {
      draftTaskId: draft.value.draftTaskId,
      version: draft.value.version,
      taskName: form.taskName.trim(),
      remark: form.remark.trim() || null,
      autoStart: form.autoStart ? 1 : 0,
      materialAdminTiming: form.materialAdminTiming,
      pullCountMin: form.pullCountMin,
      pullCountMax: form.pullCountMax,
      pullIntervalSeconds: form.pullIntervalSeconds,
      pullerCountPerGroup: form.pullerCountPerGroup,
      stationCountPerCall: form.stationCountPerCall,
      concurrentGroupCount: form.concurrentGroupCount,
      pullerRiskMinutes: form.pullerRiskMinutes,
      managerGroupId: form.managerGroupId,
      pullerGroupId: form.pullerGroupId,
      stationGroupId: form.stationGroupId
    };
  }

  async function create(): Promise<void> {
    const payload = createPayload();
    if (!payload) return;
    creating.value = true;
    try {
      await createPullTaskStandard(payload);
      visible.value = false;
      draft.value = emptyDraft();
      linksText.value = "";
      pendingFiles.value = [];
      plannedLinksText = "";
      plannedPendingNames = new Set();
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
    pendingFiles,
    open,
    addFiles,
    movePendingFile,
    removePendingFile,
    plan,
    removeRow,
    clear,
    create
  };
}
