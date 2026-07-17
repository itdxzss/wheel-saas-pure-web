import { computed, ref, type ComputedRef, type Ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  demoteHistoricalGroupParticipants,
  getHistoricalGroupDetail,
  promoteHistoricalGroupParticipants,
  removeHistoricalGroupParticipants,
  type HistoricalGroupDetail,
  type HistoricalGroupItem,
  type HistoricalGroupParticipantActionResult,
  type HistoricalGroupMember
} from "@/api/historical-group";
import { apiErrorMessage } from "@/utils/api-error";

export type HistoricalGroupParticipantAction = "promote" | "demote" | "remove";

export interface HistoricalGroupDetailOptions {
  operationAccountId: () => number | null;
  group: () => HistoricalGroupItem | null;
}

export interface HistoricalGroupDetailState {
  actionError: Ref<string>;
  actionLoading: Ref<boolean>;
  close: () => void;
  detail: Ref<HistoricalGroupDetail | null>;
  detailError: Ref<string>;
  detailLoading: Ref<boolean>;
  eligibleParticipantJids: (
    action: HistoricalGroupParticipantAction
  ) => string[];
  lastAction: Ref<HistoricalGroupParticipantAction | null>;
  lastActionResult: Ref<HistoricalGroupParticipantActionResult | null>;
  linkGateOpen: ComputedRef<boolean>;
  linkGateReason: ComputedRef<string>;
  memberManagementDisabled: ComputedRef<boolean>;
  memberManagementReason: ComputedRef<string>;
  open: () => Promise<void>;
  runParticipantAction: (
    action: HistoricalGroupParticipantAction
  ) => Promise<void>;
  selectMembers: (participantJids: string[]) => void;
  selectedJids: Ref<string[]>;
}

const actionLabels: Record<HistoricalGroupParticipantAction, string> = {
  promote: "批量提升",
  demote: "批量降级",
  remove: "批量移除"
};

function nonblank(value: string | null | undefined): value is string {
  return Boolean(value?.trim());
}

function linkFailureReason(detail: HistoricalGroupDetail | null): string {
  if (!detail) return "详情尚未加载，所有操作均已禁用";
  const parts = [
    detail.errorCode,
    detail.errorMessage,
    detail.operationDisabledReason
  ].filter(nonblank);
  return parts.length > 0
    ? parts.join(" / ")
    : "未取得可用群邀请链接，所有操作均已禁用";
}

function memberEligibleForAction(
  member: HistoricalGroupMember,
  action: HistoricalGroupParticipantAction
): boolean {
  if (!member.operationAllowed || member.self || member.owner) return false;
  if (action === "promote") return !member.admin;
  if (action === "demote") return member.admin;
  return true;
}

/** 管理固定操作账号下单个历史群的按需详情及成员操作。 */
export function useHistoricalGroupDetail(
  options: HistoricalGroupDetailOptions
): HistoricalGroupDetailState {
  const actionError = ref("");
  const actionLoading = ref(false);
  const detail = ref<HistoricalGroupDetail | null>(null);
  const detailError = ref("");
  const detailLoading = ref(false);
  const lastAction = ref<HistoricalGroupParticipantAction | null>(null);
  const lastActionResult = ref<HistoricalGroupParticipantActionResult | null>(
    null
  );
  const selectedJids = ref<string[]>([]);
  let detailRequestId = 0;
  let detailSessionId = 0;

  const linkGateOpen = computed(
    () =>
      detail.value?.linkAvailable === true && nonblank(detail.value.inviteUrl)
  );
  const linkGateReason = computed(() => {
    if (detailError.value) return detailError.value;
    return linkGateOpen.value ? "" : linkFailureReason(detail.value);
  });
  const memberManagementDisabled = computed(
    () => !linkGateOpen.value || detail.value?.operationAllowed !== true
  );
  const memberManagementReason = computed(() => {
    if (!linkGateOpen.value) return linkGateReason.value;
    if (detail.value?.operationAllowed === true) return "";
    return (
      detail.value?.operationDisabledReason ||
      "当前操作账号不是群管理员，成员管理已禁用"
    );
  });
  function resetActionState(): void {
    actionError.value = "";
    lastAction.value = null;
    lastActionResult.value = null;
    selectedJids.value = [];
  }

  async function loadDetail(
    accountId: number,
    groupJid: string,
    preserveActionResult: boolean,
    sessionId: number
  ): Promise<void> {
    const requestId = ++detailRequestId;
    detailLoading.value = true;
    detailError.value = "";
    if (!preserveActionResult) resetActionState();
    try {
      const result = await getHistoricalGroupDetail({ accountId, groupJid });
      if (requestId !== detailRequestId || sessionId !== detailSessionId)
        return;
      detail.value = result;
      selectedJids.value = [];
    } catch (error) {
      if (requestId !== detailRequestId || sessionId !== detailSessionId)
        return;
      detail.value = null;
      selectedJids.value = [];
      detailError.value = apiErrorMessage(error, "加载历史群详情失败");
      ElMessage.error(detailError.value);
    } finally {
      if (requestId === detailRequestId && sessionId === detailSessionId) {
        detailLoading.value = false;
      }
    }
  }

  async function open(): Promise<void> {
    const sessionId = ++detailSessionId;
    detailRequestId += 1;
    actionLoading.value = false;
    detailLoading.value = false;
    const accountId = options.operationAccountId();
    const activeGroup = options.group();
    if (accountId == null || !activeGroup) {
      detail.value = null;
      detailError.value = "缺少固定操作账号或目标群，详情操作已禁用";
      return;
    }
    await loadDetail(accountId, activeGroup.groupJid, false, sessionId);
  }

  function close(): void {
    detailSessionId += 1;
    detailRequestId += 1;
    actionLoading.value = false;
    detail.value = null;
    detailError.value = "";
    detailLoading.value = false;
    resetActionState();
  }

  function selectMembers(participantJids: string[]): void {
    const knownJids = new Set(
      (detail.value?.members ?? []).map(member => member.participantJid)
    );
    selectedJids.value = [
      ...new Set(participantJids.filter(jid => knownJids.has(jid)))
    ];
  }

  function eligibleParticipantJids(
    action: HistoricalGroupParticipantAction
  ): string[] {
    if (memberManagementDisabled.value || !detail.value) return [];
    const members = new Map(
      detail.value.members.map(member => [member.participantJid, member])
    );
    return selectedJids.value.filter(jid => {
      const member = members.get(jid);
      return member ? memberEligibleForAction(member, action) : false;
    });
  }

  async function confirmAction(
    action: HistoricalGroupParticipantAction,
    count: number
  ): Promise<boolean> {
    try {
      await ElMessageBox.confirm(
        `确认对 ${count} 个符合条件的成员执行“${actionLabels[action]}”吗？`,
        "历史群成员操作确认",
        {
          confirmButtonText: "确认执行",
          cancelButtonText: "取消",
          type: action === "remove" ? "warning" : "info"
        }
      );
      return true;
    } catch {
      return false;
    }
  }

  async function runParticipantAction(
    action: HistoricalGroupParticipantAction
  ): Promise<void> {
    if (actionLoading.value) return;
    const accountId = options.operationAccountId();
    const activeGroup = options.group();
    const participantJids = eligibleParticipantJids(action);
    const sessionId = detailSessionId;
    if (accountId == null || !activeGroup || participantJids.length === 0)
      return;
    if (!(await confirmAction(action, participantJids.length))) return;
    if (sessionId !== detailSessionId) return;

    actionLoading.value = true;
    actionError.value = "";
    const input = {
      accountId,
      groupJid: activeGroup.groupJid,
      participantJids
    };
    try {
      const request = {
        promote: promoteHistoricalGroupParticipants,
        demote: demoteHistoricalGroupParticipants,
        remove: removeHistoricalGroupParticipants
      }[action];
      const result = await request(input);
      if (sessionId !== detailSessionId) return;
      lastAction.value = action;
      lastActionResult.value = result;
      if (result.ok && !result.partial) {
        ElMessage.success(`${actionLabels[action]}完成`);
      } else {
        ElMessage.warning(`${actionLabels[action]}存在失败项，请查看完整结果`);
      }
    } catch (error) {
      if (sessionId !== detailSessionId) return;
      actionError.value = apiErrorMessage(error, `${actionLabels[action]}失败`);
      ElMessage.error(actionError.value);
    } finally {
      // mutation 永不重试；仅重读一次详情以反映服务端最终状态。
      if (sessionId === detailSessionId) {
        await loadDetail(accountId, activeGroup.groupJid, true, sessionId);
      }
      if (sessionId === detailSessionId) actionLoading.value = false;
    }
  }

  return {
    actionError,
    actionLoading,
    close,
    detail,
    detailError,
    detailLoading,
    eligibleParticipantJids,
    lastAction,
    lastActionResult,
    linkGateOpen,
    linkGateReason,
    memberManagementDisabled,
    memberManagementReason,
    open,
    runParticipantAction,
    selectMembers,
    selectedJids
  };
}
