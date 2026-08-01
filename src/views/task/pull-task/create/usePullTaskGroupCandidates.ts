import { ref, type Ref } from "vue";
import { ElMessage } from "element-plus";
import {
  addPullTaskGroupMarketingWaiting,
  getPullTaskGroupMarketingWaiting,
  listPullTaskGroupMarketingCandidates,
  releasePullTaskGroupMarketingWaiting,
  removePullTaskGroupMarketingWaiting,
  type PullTaskGroupCandidateRow,
  type PullTaskGroupWaitingPool
} from "@/api/pull-task";
import { apiErrorMessage } from "@/utils/api-error";
import type { PullTaskMarketingCreateDraft } from "./create-draft";
import { reconcileSelectedGroupJids } from "./create-interactions";

const WAITING_POOL_STORAGE_KEY = "pull-task-group-marketing-waiting-token";

export interface PullTaskGroupCandidateState {
  candidateGroups: Ref<PullTaskGroupCandidateRow[]>;
  waitingGroups: Ref<PullTaskGroupCandidateRow[]>;
  candidateLoading: Ref<boolean>;
  waitingPoolLoading: Ref<boolean>;
  selectedCandidateJids: Ref<string[]>;
  page: Ref<number>;
  pageSize: Ref<number>;
  total: Ref<number>;
  loadCandidates: () => Promise<void>;
  restoreWaitingPool: () => Promise<void>;
  updateCandidateSelection: (rows: PullTaskGroupCandidateRow[]) => void;
  selectAllCurrentPage: () => PullTaskGroupCandidateRow[];
  addSelectedToWaitingPool: () => Promise<void>;
  removeFromWaitingPool: (groupJid: string) => Promise<void>;
  releaseWaitingPool: () => Promise<void>;
}

function plannedStartAt(draft: PullTaskMarketingCreateDraft): number | null {
  if (draft.startMode !== "SCHEDULED" || !draft.scheduledAt) return null;
  const timestamp = new Date(draft.scheduledAt).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function usePullTaskGroupCandidates(
  draft: Ref<PullTaskMarketingCreateDraft>
): PullTaskGroupCandidateState {
  const candidateGroups = ref<PullTaskGroupCandidateRow[]>([]);
  const waitingGroups = ref<PullTaskGroupCandidateRow[]>([]);
  const candidateLoading = ref(false);
  const waitingPoolLoading = ref(false);
  const selectedCandidateJids = ref<string[]>([]);
  const page = ref(1);
  const pageSize = ref(10);
  const total = ref(0);

  function waitingPoolStorage(): Storage | null {
    return typeof window === "undefined" ? null : window.sessionStorage;
  }

  function applyWaitingPool(pool: PullTaskGroupWaitingPool): void {
    waitingGroups.value = pool.groups ?? [];
    draft.value.selectedGroupJids = waitingGroups.value.map(
      row => row.groupJid
    );
    draft.value.waitingPoolToken =
      waitingGroups.value.length > 0 ? pool.reservationToken : "";
    if (draft.value.waitingPoolToken) {
      waitingPoolStorage()?.setItem(
        WAITING_POOL_STORAGE_KEY,
        draft.value.waitingPoolToken
      );
    } else {
      waitingPoolStorage()?.removeItem(WAITING_POOL_STORAGE_KEY);
    }
    if (pool.rejected?.length) {
      ElMessage.warning(
        pool.rejected.map(item => `${item.groupJid}：${item.reason}`).join("；")
      );
    }
  }

  async function restoreWaitingPool(): Promise<void> {
    const token =
      draft.value.waitingPoolToken ||
      waitingPoolStorage()?.getItem(WAITING_POOL_STORAGE_KEY);
    if (!token) return;
    draft.value.waitingPoolToken = token;
    waitingPoolLoading.value = true;
    try {
      applyWaitingPool(await getPullTaskGroupMarketingWaiting(token));
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "等待任务池恢复失败，请稍后重试"));
    } finally {
      waitingPoolLoading.value = false;
    }
  }

  async function loadCandidates(): Promise<void> {
    candidateLoading.value = true;
    try {
      const result = await listPullTaskGroupMarketingCandidates({
        page: page.value,
        pageSize: pageSize.value,
        source: draft.value.resourceSource,
        keyword: draft.value.groupNameKeyword,
        groupJid: draft.value.groupJid,
        managerPhone: draft.value.managerPhone,
        showRegularGroups: draft.value.showRegularGroups,
        minMemberCount: draft.value.memberCountRange[0],
        maxMemberCount: draft.value.memberCountRange[1],
        announceOnly:
          draft.value.speakPermission === "ADMIN_ONLY"
            ? true
            : draft.value.speakPermission === "ALL_MEMBERS"
              ? false
              : undefined,
        reservationToken: draft.value.waitingPoolToken
      });
      candidateGroups.value = result.list ?? [];
      total.value = result.total ?? 0;
    } catch (error) {
      candidateGroups.value = [];
      total.value = 0;
      ElMessage.error(apiErrorMessage(error, "候选群组加载失败"));
    } finally {
      candidateLoading.value = false;
    }
  }

  function updateCandidateSelection(rows: PullTaskGroupCandidateRow[]): void {
    selectedCandidateJids.value = reconcileSelectedGroupJids(
      selectedCandidateJids.value,
      candidateGroups.value.map(row => row.groupJid),
      rows.map(row => row.groupJid)
    );
  }

  function selectAllCurrentPage(): PullTaskGroupCandidateRow[] {
    const selectableRows = candidateGroups.value.filter(
      row => row.selectable && !row.inCurrentWaitingPool
    );
    updateCandidateSelection(selectableRows);
    return selectableRows;
  }

  async function addSelectedToWaitingPool(): Promise<void> {
    if (selectedCandidateJids.value.length === 0) {
      ElMessage.warning("请先勾选可执行群组");
      return;
    }
    waitingPoolLoading.value = true;
    try {
      const pool = await addPullTaskGroupMarketingWaiting({
        reservationToken: draft.value.waitingPoolToken || null,
        taskName: draft.value.taskName,
        plannedStartAt: plannedStartAt(draft.value),
        groupJids: selectedCandidateJids.value
      });
      applyWaitingPool(pool);
      selectedCandidateJids.value = [];
      ElMessage.success(`等待任务池现有 ${pool.groups.length} 个群组`);
      await loadCandidates();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "加入等待任务池失败"));
    } finally {
      waitingPoolLoading.value = false;
    }
  }

  async function removeFromWaitingPool(groupJid: string): Promise<void> {
    if (!draft.value.waitingPoolToken) return;
    waitingPoolLoading.value = true;
    try {
      const pool = await removePullTaskGroupMarketingWaiting({
        reservationToken: draft.value.waitingPoolToken,
        groupJid
      });
      applyWaitingPool(pool);
      await loadCandidates();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "移出等待任务池失败"));
    } finally {
      waitingPoolLoading.value = false;
    }
  }

  async function releaseWaitingPool(): Promise<void> {
    const token = draft.value.waitingPoolToken;
    if (!token) return;
    waitingPoolLoading.value = true;
    try {
      await releasePullTaskGroupMarketingWaiting(token);
      waitingGroups.value = [];
      draft.value.selectedGroupJids = [];
      draft.value.waitingPoolToken = "";
      waitingPoolStorage()?.removeItem(WAITING_POOL_STORAGE_KEY);
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "释放等待任务池失败"));
      throw error;
    } finally {
      waitingPoolLoading.value = false;
    }
  }

  return {
    candidateGroups,
    waitingGroups,
    candidateLoading,
    waitingPoolLoading,
    selectedCandidateJids,
    page,
    pageSize,
    total,
    loadCandidates,
    restoreWaitingPool,
    updateCandidateSelection,
    selectAllCurrentPage,
    addSelectedToWaitingPool,
    removeFromWaitingPool,
    releaseWaitingPool
  };
}
