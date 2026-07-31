import { reactive, ref, type Ref } from "vue";
import { ElMessage } from "element-plus";
import {
  createPullTask,
  listPullTaskGroupLinks,
  listPullTaskLinkGroups,
  type CreatePullTaskRequest,
  type PullTaskLinkGroup,
  type PullTaskLinkOption
} from "@/api/pull-task";
import {
  listAccountGroups,
  type AccountGroupApiRow
} from "@/api/account-group";
import { apiErrorMessage } from "@/utils/api-error";

export interface StandardPullTaskCreateForm {
  taskName: string;
  subMode: "OLD_LINK" | "CREATE_NEW";
  useAdmin: boolean;
  wsLinkGroupId: number | "";
  groupLinkIds: number[];
  pastedLinks: string;
  templateId: number;
  adminGroupId: number | "";
  pullerGroupId: number | "";
  stationOneGroupId: number | "";
  stationTwoGroupId: number | "";
  stationThreeGroupId: number | "";
  adminPerGroup: number;
  pullerPerGroup: number;
  stationOnePerGroup: number;
  stationTwoPerGroup: number;
  stationThreePerGroup: number;
  autoSupplementAdminCount: number;
  autoSupplementAdminTimes: number;
  autoSupplementPullerCount: number;
  autoSupplementPullerTimes: number;
  pullerFinishGroupId: number | "";
  adminFinishGroupId: number | "";
  autoStart: boolean;
  pullerEnterFirst: boolean;
  auditMode: string;
  noReleaseAfterPull: boolean;
  pullerSyncMode: string;
  waitBeforePullSeconds: number;
  concurrentTaskCount: number;
  firstPullCount: number;
  pullCountMin: number;
  pullCountMax: number;
  pullIntervalSeconds: number;
  pullerMaxTotal: number;
  pullerThreadCount: number;
  stationJoinMode: string;
  pullerJoinMode: string;
  pullerQuitMode: string;
  adminQuitMode: string;
  stationQuitAfterDone: boolean;
  groupName: string;
  mute: boolean;
  linkPermission: string;
  editPermission: string;
  autoCloseInvite: boolean;
  materialText: string;
  waterText: string;
  waterMode: string;
  remark: string;
}

export interface StandardPullTaskCreateOptions {
  onCreated: () => Promise<void>;
}

export interface StandardPullTaskCreateState {
  visible: Ref<boolean>;
  loading: Ref<boolean>;
  creating: Ref<boolean>;
  groupLinksLoading: Ref<boolean>;
  form: StandardPullTaskCreateForm;
  accountGroups: Ref<AccountGroupApiRow[]>;
  linkGroups: Ref<PullTaskLinkGroup[]>;
  groupLinkOptions: Ref<PullTaskLinkOption[]>;
  open: () => Promise<void>;
  create: () => Promise<void>;
  loadGroupLinks: () => Promise<void>;
  readMaterialFile: (file?: File) => Promise<void>;
  readWaterFile: (file?: File) => Promise<void>;
}

function emptyForm(): StandardPullTaskCreateForm {
  return {
    taskName: "",
    subMode: "OLD_LINK",
    useAdmin: true,
    wsLinkGroupId: "",
    groupLinkIds: [],
    pastedLinks: "",
    templateId: 0,
    adminGroupId: "",
    pullerGroupId: "",
    stationOneGroupId: "",
    stationTwoGroupId: "",
    stationThreeGroupId: "",
    adminPerGroup: 1,
    pullerPerGroup: 1,
    stationOnePerGroup: 0,
    stationTwoPerGroup: 0,
    stationThreePerGroup: 0,
    autoSupplementAdminCount: 0,
    autoSupplementAdminTimes: 0,
    autoSupplementPullerCount: 0,
    autoSupplementPullerTimes: 0,
    pullerFinishGroupId: "",
    adminFinishGroupId: "",
    autoStart: false,
    pullerEnterFirst: true,
    auditMode: "关闭审核模式进群",
    noReleaseAfterPull: false,
    pullerSyncMode: "单个同步",
    waitBeforePullSeconds: 3,
    concurrentTaskCount: 1,
    firstPullCount: 1,
    pullCountMin: 3,
    pullCountMax: 5,
    pullIntervalSeconds: 6,
    pullerMaxTotal: 50,
    pullerThreadCount: 1,
    stationJoinMode: "快速踩群链接",
    pullerJoinMode: "快速踩群链接",
    pullerQuitMode: "不退拉手",
    adminQuitMode: "不退管理员",
    stationQuitAfterDone: false,
    groupName: "",
    mute: false,
    linkPermission: "所有成员可邀请",
    editPermission: "仅管理员可编辑",
    autoCloseInvite: false,
    materialText: "",
    waterText: "",
    waterMode: "一号多群",
    remark: ""
  };
}

function idOrNull(value: number | ""): number | null {
  return typeof value === "number" && value > 0 ? value : null;
}

function linesOf(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map(item => item.trim())
    .filter(Boolean);
}

function toPayload(form: StandardPullTaskCreateForm): CreatePullTaskRequest {
  return {
    taskName: form.taskName.trim(),
    subMode: form.subMode,
    useAdmin: form.useAdmin,
    wsLinkGroupId: idOrNull(form.wsLinkGroupId),
    groupLinkIds: [...form.groupLinkIds],
    pastedLinks: linesOf(form.pastedLinks),
    templateId: idOrNull(form.templateId),
    adminGroupId: idOrNull(form.adminGroupId),
    pullerGroupId: idOrNull(form.pullerGroupId),
    stationOneGroupId: idOrNull(form.stationOneGroupId),
    stationTwoGroupId: idOrNull(form.stationTwoGroupId),
    stationThreeGroupId: idOrNull(form.stationThreeGroupId),
    adminPerGroup: form.adminPerGroup,
    pullerPerGroup: form.pullerPerGroup,
    stationOnePerGroup: form.stationOnePerGroup,
    stationTwoPerGroup: form.stationTwoPerGroup,
    stationThreePerGroup: form.stationThreePerGroup,
    autoSupplementAdminCount: form.autoSupplementAdminCount,
    autoSupplementAdminTimes: form.autoSupplementAdminTimes,
    autoSupplementPullerCount: form.autoSupplementPullerCount,
    autoSupplementPullerTimes: form.autoSupplementPullerTimes,
    pullerFinishGroupId: idOrNull(form.pullerFinishGroupId),
    adminFinishGroupId: idOrNull(form.adminFinishGroupId),
    autoStart: form.autoStart,
    pullerEnterFirst: form.pullerEnterFirst,
    auditMode: form.auditMode,
    noReleaseAfterPull: form.noReleaseAfterPull,
    pullerSyncMode: form.pullerSyncMode,
    waitBeforePullSeconds: form.waitBeforePullSeconds,
    concurrentTaskCount: form.concurrentTaskCount,
    firstPullCount: form.firstPullCount,
    pullCountMin: form.pullCountMin,
    pullCountMax: form.pullCountMax,
    pullIntervalSeconds: form.pullIntervalSeconds,
    pullerMaxTotal: form.pullerMaxTotal,
    pullerThreadCount: form.pullerThreadCount,
    stationJoinMode: form.stationJoinMode,
    pullerJoinMode: form.pullerJoinMode,
    pullerQuitMode: form.pullerQuitMode,
    adminQuitMode: form.adminQuitMode,
    stationQuitAfterDone: form.stationQuitAfterDone,
    materialText: form.materialText.trim(),
    waterText: form.waterText.trim() || null,
    waterMode: form.waterMode,
    groupProfile: {
      groupName: form.groupName.trim() || null,
      mute: form.mute,
      linkPermission: form.linkPermission,
      editPermission: form.editPermission,
      autoCloseInvite: form.autoCloseInvite
    },
    remark: form.remark.trim() || null
  };
}

export function useStandardPullTaskCreate(
  options: StandardPullTaskCreateOptions
): StandardPullTaskCreateState {
  const visible = ref(false);
  const loading = ref(false);
  const creating = ref(false);
  const groupLinksLoading = ref(false);
  const form = reactive<StandardPullTaskCreateForm>(emptyForm());
  const accountGroups = ref<AccountGroupApiRow[]>([]);
  const linkGroups = ref<PullTaskLinkGroup[]>([]);
  const groupLinkOptions = ref<PullTaskLinkOption[]>([]);

  async function open(): Promise<void> {
    Object.assign(form, emptyForm());
    groupLinkOptions.value = [];
    visible.value = true;
    loading.value = true;
    const [accountResult, linkGroupResult] = await Promise.allSettled([
      listAccountGroups({ page: 1, pageSize: 500 }),
      listPullTaskLinkGroups()
    ]);
    if (accountResult.status === "fulfilled") {
      accountGroups.value = accountResult.value.list ?? [];
    } else {
      accountGroups.value = [];
      ElMessage.error(
        apiErrorMessage(accountResult.reason, "账号分组加载失败")
      );
    }
    if (linkGroupResult.status === "fulfilled") {
      linkGroups.value = linkGroupResult.value ?? [];
    } else {
      linkGroups.value = [];
      ElMessage.error(
        apiErrorMessage(linkGroupResult.reason, "WS链接分组加载失败")
      );
    }
    loading.value = false;
  }

  async function loadGroupLinks(): Promise<void> {
    form.groupLinkIds = [];
    groupLinkOptions.value = [];
    if (!form.wsLinkGroupId) return;
    groupLinksLoading.value = true;
    try {
      const result = await listPullTaskGroupLinks({
        page: 1,
        pageSize: 500,
        labelId: form.wsLinkGroupId
      });
      groupLinkOptions.value = result.list ?? [];
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "群链接加载失败"));
    } finally {
      groupLinksLoading.value = false;
    }
  }

  async function create(): Promise<void> {
    if (!form.taskName.trim()) {
      ElMessage.warning("请填写任务名称");
      return;
    }
    if (
      form.subMode === "OLD_LINK" &&
      form.groupLinkIds.length === 0 &&
      linesOf(form.pastedLinks).length === 0
    ) {
      ElMessage.warning("老群链接任务请选择或粘贴群链接");
      return;
    }
    if (!form.pullerGroupId) {
      ElMessage.warning("请选择拉手分组");
      return;
    }
    if (!form.materialText.trim()) {
      ElMessage.warning("请粘贴或上传料子数据");
      return;
    }
    creating.value = true;
    try {
      await createPullTask(toPayload(form));
      visible.value = false;
      ElMessage.success("拉群任务已创建");
      await options.onCreated();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "拉群任务创建失败"));
    } finally {
      creating.value = false;
    }
  }

  async function readFileText(file?: File): Promise<string> {
    return file ? file.text() : "";
  }

  async function readMaterialFile(file?: File): Promise<void> {
    const text = await readFileText(file);
    if (!text) return;
    form.materialText = text;
    ElMessage.success("料子文件已读取");
  }

  async function readWaterFile(file?: File): Promise<void> {
    const text = await readFileText(file);
    if (!text) return;
    form.waterText = text;
    ElMessage.success("水军文件已读取");
  }

  return {
    visible,
    loading,
    creating,
    groupLinksLoading,
    form,
    accountGroups,
    linkGroups,
    groupLinkOptions,
    open,
    create,
    loadGroupLinks,
    readMaterialFile,
    readWaterFile
  };
}
