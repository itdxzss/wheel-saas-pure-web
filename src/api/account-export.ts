import { armadaRequest } from "@/api/armada";
import { http } from "@/utils/http";

/** 对应后端 AccountExportJobVO；不含任何凭据内容。 */
export interface AccountExportJob {
  id: string;
  status: "READY" | "COMPLETED" | "CANCELLED";
  accountCount: number;
  filename: string;
  sha256: string;
  fileSize: number;
  createdAt: number;
  expiresAt: number;
}

export function createAccountExport(requestId: string, ids: number[]) {
  return armadaRequest<AccountExportJob>("post", "/api/accounts/exports", {
    data: { requestId, ids }
  });
}

export function listAccountExports() {
  return armadaRequest<AccountExportJob[]>("get", "/api/accounts/exports");
}

export function downloadAccountExport(id: string): Promise<Blob> {
  return http.request<Blob>("get", `/api/accounts/exports/${id}/file`, {
    responseType: "blob"
  });
}

export function completeAccountExport(id: string, sha256: string) {
  return armadaRequest<AccountExportJob>(
    "post",
    `/api/accounts/exports/${id}/complete`,
    { data: { sha256 } }
  );
}

export function cancelAccountExport(id: string) {
  return armadaRequest<void>("post", `/api/accounts/exports/${id}/cancel`);
}
