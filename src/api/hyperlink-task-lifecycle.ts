import { armadaRequest } from "@/api/armada";

export type HyperlinkTaskMode = "instant" | "rolling" | "cycle";
export type HyperlinkTaskAction = "START" | "PAUSE" | "RESUME" | "STOP";
export type HyperlinkProvisionStatus =
  | "NOT_REQUIRED"
  | "PROCESSING"
  | "READY"
  | "FAILED";

export type HyperlinkTaskQuoteRequest =
  | {
      purpose: "CREATE";
      taskId: null;
      dataPackageId: number;
      taskMode: HyperlinkTaskMode;
      maxExecutingAccounts: number;
    }
  | {
      purpose: "START";
      taskId: number;
      dataPackageId: null;
      taskMode: null;
      maxExecutingAccounts: null;
    };

export interface HyperlinkTaskQuoteBreakdown {
  recipientCountryIso2: string | null;
  recipientCount: number;
  unitPrice: number;
  amount: number;
}

export interface HyperlinkTaskQuote {
  quoteToken: string;
  expiresAt: number;
  dataPackageId: number;
  dataPackageGeneration: number;
  dataPackageName: string;
  recipientCount: number;
  pricingMode: "NORMAL" | "SUPER";
  priceCode: string;
  currencyCode: string;
  unitPrice: number | null;
  pricingBreakdown: HyperlinkTaskQuoteBreakdown[];
  estimatedAmount: number;
  accountBalance: number;
  giftBalance: number;
  availableBalance: number;
}

export interface HyperlinkTaskMutationReceipt {
  taskId: number;
  provisionStatus: HyperlinkProvisionStatus;
  enabled: boolean;
  runStatus: 0 | 1 | 2 | 3 | 4;
  version: number;
  pollAfterMs: number | null;
  failureCode: number | null;
  failureReason: string | null;
}

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
