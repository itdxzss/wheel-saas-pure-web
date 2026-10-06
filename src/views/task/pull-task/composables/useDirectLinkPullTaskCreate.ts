import { reactive } from "vue";
import { ElMessage } from "element-plus";
import {
  listAccountGroups,
  type AccountGroupApiRow
} from "@/api/account-group";
import { listGroupFolders, type GroupFolderRow } from "@/api/group-folder";
import {
  createPullTaskDirectLink,
  type PullTaskDirectLinkCreateRequest
} from "@/api/pull-task";
import { apiErrorMessage } from "@/utils/api-error";

export interface DirectLinkPullTaskForm {
  taskName: string;
  remark: string;
  autoStart: boolean;
  groupFolderId: number | "";
  linksText: string;
  earlyPullCount: number;
  earlyPullCallCount: number;
  pullCountMin: number;
  pullCountMax: number;
  pullIntervalSeconds: number;
  pullerCountPerGroup: number;
  stationCountPerCall: number;
  concurrentGroupCount: number;
  pullerGroupId: number | "";
  stationGroupId: number | "";
  pullerFinishGroupId: number | "";
}

export interface DirectLinkPullTaskCreateState {
  form: DirectLinkPullTaskForm;
  files: File[];
  packageIds: number[];
  accountGroups: AccountGroupApiRow[];
  groupFolders: GroupFolderRow[];
  loading: boolean;
  creating: boolean;
  error: string;
  load: () => Promise<void>;
  create: () => Promise<void>;
  addFiles: (files: File[]) => void;
  removeFile: (name: string) => void;
  moveFile: (name: string, offset: -1 | 1) => void;
  addPackages: (ids: number[]) => void;
  removePackage: (id: number) => void;
  reset: () => void;
}

function emptyForm(): DirectLinkPullTaskForm {
  return {
    taskName: `任务_${Date.now().toString().slice(-8)}`,
    remark: "",
    autoStart: true,
    groupFolderId: "",
    linksText: "",
    earlyPullCount: 1,
    earlyPullCallCount: 2,
    pullCountMin: 50,
    pullCountMax: 50,
    pullIntervalSeconds: 15,
    pullerCountPerGroup: 2,
    stationCountPerCall: 0,
    concurrentGroupCount: 1,
    pullerGroupId: "",
    stationGroupId: "",
    pullerFinishGroupId: ""
  };
}

function positiveId(value: number | ""): number | null {
  return typeof value === "number" && value > 0 ? value : null;
}

/** getRandomValues 同样支持 HTTP 测试环境。 */
function requestUuid(): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, byte =>
    byte.toString(16).padStart(2, "0")
  ).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function useDirectLinkPullTaskCreate(options: {
  onCreated: () => Promise<void>;
}): DirectLinkPullTaskCreateState {
  let requestId = "";
  let previousRequest = "";
  let previousFiles: File[] = [];
  const state = reactive<DirectLinkPullTaskCreateState>({
    form: emptyForm(),
    files: [],
    packageIds: [],
    accountGroups: [],
    groupFolders: [],
    loading: false,
    creating: false,
    error: "",
    load,
    create,
    addFiles,
    removeFile,
    moveFile,
    addPackages,
    removePackage,
    reset
  });

  async function load(): Promise<void> {
    if (state.loading) return;
    state.loading = true;
    const [groups, folders] = await Promise.allSettled([
      listAccountGroups({ page: 1, pageSize: 500 }),
      listGroupFolders({ page: 1, pageSize: 500 })
    ]);
    const errors: string[] = [];
    if (groups.status === "fulfilled")
      state.accountGroups = groups.value.list ?? [];
    else errors.push(apiErrorMessage(groups.reason, "账号分组加载失败"));
    if (folders.status === "fulfilled")
      state.groupFolders = (folders.value.list ?? []).filter(
        folder => !folder.systemBuiltin
      );
    else errors.push(apiErrorMessage(folders.reason, "群组分组加载失败"));
    state.error = errors.join("；");
    state.loading = false;
  }

  function addFiles(files: File[]): void {
    state.error = "";
    for (const file of files) {
      if (
        !file.name.toLowerCase().endsWith(".txt") ||
        file.size > 2 * 1024 * 1024
      ) {
        state.error = "请选择不超过 2MB 的 TXT 文件";
        continue;
      }
      if (state.files.some(item => item.name === file.name)) {
        state.error = `${file.name} 已添加，请勿重复上传同名文件`;
        continue;
      }
      if (state.files.length + state.packageIds.length >= 50) {
        state.error = "TXT 与数据包合计最多 50 份";
        break;
      }
      state.files.push(file);
    }
  }

  function removeFile(name: string): void {
    state.files = state.files.filter(file => file.name !== name);
  }
  function moveFile(name: string, offset: -1 | 1): void {
    const index = state.files.findIndex(file => file.name === name);
    const target = index + offset;
    if (index < 0 || target < 0 || target >= state.files.length) return;
    const [file] = state.files.splice(index, 1);
    state.files.splice(target, 0, file);
  }
  function addPackages(ids: number[]): void {
    const next = [...new Set([...state.packageIds, ...ids])];
    if (next.length + state.files.length > 50) {
      state.error = "TXT 与数据包合计最多 50 份";
      return;
    }
    state.packageIds = next;
    state.error = "";
  }
  function removePackage(id: number): void {
    state.packageIds = state.packageIds.filter(item => item !== id);
  }
  function reset(): void {
    Object.assign(state.form, emptyForm());
    state.files = [];
    state.packageIds = [];
    state.error = "";
    requestId = "";
    previousRequest = "";
    previousFiles = [];
  }

  function validate(): string {
    const form = state.form;
    if (!form.taskName.trim()) return "请填写任务名称";
    if (form.taskName.trim().length > 128 || form.remark.trim().length > 500)
      return "任务名称最多 128 字，备注最多 500 字";
    if (!positiveId(form.groupFolderId) && !form.linksText.trim())
      return "请选择群组分组或粘贴群链接";
    if (!state.files.length && !state.packageIds.length)
      return "请上传 TXT 料子或选择数据包";
    if (!positiveId(form.pullerGroupId)) return "请选择拉手分组";
    if (form.stationCountPerCall > 0 && !positiveId(form.stationGroupId))
      return "请选择站台分组";
    for (const value of [
      form.earlyPullCount,
      form.earlyPullCallCount,
      form.pullCountMin,
      form.pullCountMax,
      form.pullerCountPerGroup,
      form.concurrentGroupCount
    ]) {
      if (!Number.isInteger(value) || value < 1)
        return "拉人人数、拉手数量与执行次数必须为正整数";
    }
    if (form.pullCountMax < form.pullCountMin)
      return "单次拉人数范围配置不正确";
    if (form.pullerCountPerGroup > 50 || form.concurrentGroupCount > 100)
      return "拉手数量最多 50，同时启动任务数最多 100";
    if (
      !Number.isInteger(form.stationCountPerCall) ||
      form.stationCountPerCall < 0 ||
      form.stationCountPerCall > 50
    )
      return "站台数量须为 0–50 的整数";
    if (
      !Number.isInteger(form.pullIntervalSeconds) ||
      form.pullIntervalSeconds < 0
    )
      return "拉人间隔必须为非负整数";
    return "";
  }

  async function create(): Promise<void> {
    if (state.creating) return;
    state.error = validate();
    if (state.error) return;
    const form = state.form;
    const request: Omit<PullTaskDirectLinkCreateRequest, "requestId"> = {
      ...form,
      taskName: form.taskName.trim(),
      remark: form.remark.trim() || null,
      autoStart: form.autoStart ? 1 : 0,
      groupFolderId: positiveId(form.groupFolderId),
      linksText: form.linksText.trim(),
      packageIds: [...state.packageIds],
      pullerGroupId: positiveId(form.pullerGroupId)!,
      stationGroupId: positiveId(form.stationGroupId),
      pullerFinishGroupId: positiveId(form.pullerFinishGroupId)
    };
    const serialized = JSON.stringify(request);
    const files = [...state.files];
    if (
      serialized !== previousRequest ||
      files.length !== previousFiles.length ||
      files.some((file, index) => file !== previousFiles[index])
    ) {
      requestId = requestUuid();
      previousRequest = serialized;
      previousFiles = files;
    }
    state.creating = true;
    try {
      await createPullTaskDirectLink({ ...request, requestId }, files);
      reset();
      ElMessage.success("拉群任务已创建");
      await options.onCreated();
    } catch (error) {
      state.error = apiErrorMessage(error, "拉群任务创建失败");
    } finally {
      state.creating = false;
    }
  }
  return state;
}
