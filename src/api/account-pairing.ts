import { armadaRequest } from "@/api/armada";

export type ControlPairingStatus =
  | "REQUESTING"
  | "WAITING_CONFIRMATION"
  | "FINALIZING"
  | "SUCCEEDED"
  | "FAILED"
  | "EXPIRED";

export interface ControlPairingCreateRequest {
  phone: string;
  accountGroupId: number;
  remark?: string | null;
}

export interface ControlPairingCreated {
  sessionId: number;
  status: ControlPairingStatus;
  expiresAt: number;
}

export interface ControlPairingState {
  status: ControlPairingStatus;
  pairingCode: string | null;
  expiresAt: number;
  accountId: number | null;
  errorCode: string | null;
  errorMessage: string | null;
}

/** 后端固定认证码，浏览器只提交手机号和账号归属信息。 */
export function createControlPairingSession(
  data: ControlPairingCreateRequest
): Promise<ControlPairingCreated> {
  return armadaRequest<ControlPairingCreated>(
    "post",
    "/api/account-pairing-sessions",
    { data }
  );
}

export function getControlPairingSession(
  sessionId: number
): Promise<ControlPairingState> {
  return armadaRequest<ControlPairingState>(
    "get",
    `/api/account-pairing-sessions/${sessionId}`
  );
}
