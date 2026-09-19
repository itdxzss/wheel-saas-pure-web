import type { TenantAccount } from "@/api/account";
import type { AccountExportJob } from "@/api/account-export";

/** 只接收勾选快照；绝不将空选择变成全部账号，也不自动执行下线。 */
export function selectedExportIds(rows: TenantAccount[]): number[] {
  if (!rows.length) throw new Error("请先勾选需要导出的账号");
  if (rows.length > 500) throw new Error("单次最多导出 500 个账号");
  if (rows.some(row => !Number.isSafeInteger(row.id) || (row.id ?? 0) <= 0)) {
    throw new Error("勾选账号数据异常，请刷新后重试");
  }
  if (rows.some(row => row.login_state !== 2)) {
    throw new Error("所选账号包含非离线账号，请先批量离线并等待完成后再导出");
  }
  return [...new Set(rows.map(row => row.id as number))].sort((a, b) => a - b);
}

interface DeliveryActions {
  download: (id: string) => Promise<Blob>;
  save: (filename: string, file: Blob) => void;
  complete: (id: string, digest: string) => Promise<AccountExportJob>;
}

/** 完整收到附件后才提交移除；任何下载或保存触发失败都不得调用 complete。 */
export async function deliverAccountExport(
  job: AccountExportJob,
  actions: DeliveryActions
): Promise<void> {
  const file = await actions.download(job.id);
  if (file.size !== job.fileSize || file.size < 4) {
    throw new Error("文件未完整接收，账号未移除，请重试下载");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (
    bytes[0] !== 0x50 ||
    bytes[1] !== 0x4b ||
    bytes[2] !== 3 ||
    bytes[3] !== 4
  ) {
    throw new Error("下载内容不是账号 ZIP，账号未移除");
  }
  // HTTPS 环境进一步验证内容摘要；HTTP 测试环境仍核对完整长度和 ZIP 标识。
  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const hex = Array.from(new Uint8Array(digest), byte =>
      byte.toString(16).padStart(2, "0")
    ).join("");
    if (hex !== job.sha256)
      throw new Error("文件校验失败，账号未移除，请重新下载");
  }
  actions.save(job.filename, file);
  if (job.status === "READY") await actions.complete(job.id, job.sha256);
}
