import { computed, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { TenantAccount } from "@/api/account";
import {
  listWbCompanionSummaries,
  type WbCompanionSummary
} from "@/api/wb-companion";

/** 账号列表上的"WB 分身"：列快照、登录弹窗、详情抽屉和下线/删除前的提醒。 */
export function useWbCompanion() {
  const summaries = ref<Record<number, WbCompanionSummary>>({});
  const dialogOpen = ref(false);
  const dialogAccounts = ref<TenantAccount[]>([]);
  const drawerOpen = ref(false);
  const drawerAccount = ref<TenantAccount | null>(null);

  /** 列表刷新后按当前页账号读快照；失败不影响列表本身。 */
  async function loadSummaries(rows: TenantAccount[]): Promise<void> {
    const ids = rows
      .map(row => row.id)
      .filter((id): id is number => typeof id === "number");
    if (ids.length === 0) {
      summaries.value = {};
      return;
    }
    try {
      const list = await listWbCompanionSummaries(ids);
      summaries.value = Object.fromEntries(
        list.map(item => [item.accountId, item])
      );
    } catch {
      summaries.value = {};
    }
  }

  function openDialog(accounts: TenantAccount[]): void {
    dialogAccounts.value = accounts;
    dialogOpen.value = true;
  }

  function openDrawer(account: TenantAccount): void {
    drawerAccount.value = account;
    drawerOpen.value = true;
  }

  /** 已挂分身或进行中的号打开详情，其余打开登录弹窗。 */
  function openFor(row: TenantAccount): void {
    if (row.id !== undefined && summaries.value[row.id]) {
      openDrawer(row);
    } else {
      openDialog([row]);
    }
  }

  /** 只有在线的安卓协议号能登录到 WB；批量时排除其余账号并提示。 */
  function openBatch(rows: TenantAccount[]): void {
    const eligible = rows.filter(
      row =>
        (row.protocol_address ?? "").toUpperCase() === "ANDROID" &&
        row.login_state === 1
    );
    if (eligible.length === 0) {
      ElMessage.warning("选中的账号里没有在线的安卓号");
      return;
    }
    if (eligible.length < rows.length) {
      ElMessage.info(
        `已排除 ${rows.length - eligible.length} 个非安卓或不在线的账号`
      );
    }
    openDialog(eligible);
  }

  /** 单个已挂分身的号打开弹窗时锁定环境和用户，只做补齐。 */
  const dialogSummary = computed(() => {
    const only = dialogAccounts.value;
    return only.length === 1 && only[0].id !== undefined
      ? (summaries.value[only[0].id] ?? null)
      : null;
  });

  /**
   * 安卓号是这些分身的主设备：下线会让 WB 连接全部掉线，删除会让 WhatsApp 移除它们。
   * 挂着分身的账号在下线、删除前多确认一次；返回 false 表示操作人取消。
   */
  async function confirmIfBound(
    ids: number[],
    action: "下线" | "删除"
  ): Promise<boolean> {
    const bound = ids
      .map(id => summaries.value[id])
      .filter(item => item && item.connectionCount > 0);
    if (bound.length === 0) return true;
    const total = bound.reduce((sum, item) => sum + item.connectionCount, 0);
    const consequence =
      action === "下线"
        ? "下线期间这些 WB 连接都会掉线、停止发送；重新上线后 WB 会自动重连。"
        : "删除后这些分身会被 WhatsApp 移除，WB 用户的设备不能再发送，也无法恢复。";
    try {
      await ElMessageBox.confirm(
        `其中 ${bound.length} 个账号在 WB 挂着共 ${total} 个分身。${consequence}`,
        `确认${action}？`,
        {
          confirmButtonText: action === "下线" ? "仍然下线" : "删除并移除分身",
          cancelButtonText: "取消",
          type: action === "下线" ? "warning" : "error"
        }
      );
      return true;
    } catch {
      return false;
    }
  }

  return {
    summaries,
    dialogOpen,
    dialogAccounts,
    drawerOpen,
    drawerAccount,
    loadSummaries,
    dialogSummary,
    openDialog,
    openDrawer,
    openFor,
    openBatch,
    confirmIfBound
  };
}
