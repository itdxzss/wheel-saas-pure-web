import { armadaRequest } from "@/api/armada";

export interface ProtocolRestartProcess {
  processName: string;
  readyUrl: string;
  ready: boolean;
  statusCode: number | null;
  error: string | null;
  checkedAt: number;
}

export interface ProtocolRestartResult {
  success: boolean;
  command: string;
  startedAt: number;
  finishedAt: number;
  elapsedMs: number;
  processes: ProtocolRestartProcess[];
  message: string;
}

export function restartProtocolProcesses(): Promise<ProtocolRestartResult> {
  return armadaRequest<ProtocolRestartResult>("post", "/api/protocol/restart");
}
