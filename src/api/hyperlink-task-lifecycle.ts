import { armadaRequest } from "@/api/armada";
import type {
  HyperlinkTaskMutationReceipt,
  HyperlinkTaskQuote
} from "@/api/hyperlink-task";

export type {
  HyperlinkTaskMutationReceipt,
  HyperlinkTaskQuote
} from "@/api/hyperlink-task";

export type HyperlinkTaskMode = "instant" | "rolling" | "cycle";
export type HyperlinkTaskAction = "START" | "PAUSE" | "RESUME" | "STOP";
export type HyperlinkTaskQuoteRequest =
  | {
      purpose: "CREATE";
      taskId: null;
      dataPackageId: number;
      taskMode: HyperlinkTaskMode;
      maxExecutingAccounts: number;
      maxUseAccounts: number;
    }
  | {
      purpose: "START";
      taskId: number;
      dataPackageId: null;
      taskMode: null;
      maxExecutingAccounts: null;
      maxUseAccounts: null;
    };

export interface HyperlinkTaskActionRequest {
  action: HyperlinkTaskAction;
  version: number;
  quoteToken: string | null;
}

export function quoteHyperlinkTask(
  data: HyperlinkTaskQuoteRequest
): Promise<HyperlinkTaskQuote> {
  return armadaRequest("post", "/api/hyperlink-tasks/quote", { data });
}

/** H2 拥有保存 DTO；H3 只提供不复制表单模型的公共提交入口。 */
export function createHyperlinkTask<TSaveRequest extends object>(
  data: TSaveRequest
): Promise<HyperlinkTaskMutationReceipt> {
  return armadaRequest("post", "/api/hyperlink-tasks", { data });
}

/** H2 拥有保存 DTO；调用方必须原样携带当前 version。 */
export function updateHyperlinkTask<TSaveRequest extends object>(
  id: number,
  data: TSaveRequest
): Promise<HyperlinkTaskMutationReceipt> {
  return armadaRequest("put", `/api/hyperlink-tasks/${id}`, { data });
}

export function getHyperlinkTaskProvisionStatus(
  id: number
): Promise<HyperlinkTaskMutationReceipt> {
  return armadaRequest("get", `/api/hyperlink-tasks/${id}/provision-status`);
}

export function actOnHyperlinkTask(
  id: number,
  data: HyperlinkTaskActionRequest
): Promise<HyperlinkTaskMutationReceipt> {
  return armadaRequest("post", `/api/hyperlink-tasks/${id}/action`, { data });
}
