import { armadaRequest } from "@/api/armada";
import type { PageResponse } from "@/api/account-group";

export interface MutualChatRequest {
  leftGroupId: number;
  rightGroupId: number;
  intervalSeconds: number;
  leftText: string;
  rightText: string;
  requestId?: string;
  previewToken?: string;
}
export interface MutualChatGroup {
  id: number;
  name: string;
  total: number;
  eligible: number;
  excluded: number;
}
export interface MutualChatPreview {
  left: MutualChatGroup;
  right: MutualChatGroup;
  pairCount: number;
  operationCount: number;
  previewToken: string;
}
export interface MutualChatStats {
  total: number;
  pending: number;
  submitted: number;
  success: number;
  failed: number;
  unknown: number;
  canceled: number;
  mutualPairs: number;
  oneWayPairs: number;
}
export interface MutualChatTask {
  id: number;
  leftGroupName: string;
  rightGroupName: string;
  leftCount: number;
  rightCount: number;
  intervalSeconds: number;
  leftText: string;
  rightText: string;
  status: number;
  createdAt: number;
  stats: MutualChatStats;
}
export interface MutualChatItem {
  id: number;
  actorId: number;
  targetId: number;
  actorPhone: string;
  targetPhone: string;
  protocolBackend: string;
  status: number;
  attemptNo: number;
  direction: number;
  protocolMessageId?: string;
  reasonCode?: string;
  submittedAt?: number;
  resultAt?: number;
}
const base = "/api/accounts/mutual-chat-tasks";
export const previewMutualChats = (data: MutualChatRequest) =>
  armadaRequest<MutualChatPreview>("post", `${base}/preview`, { data });
export const createMutualChats = (data: MutualChatRequest) =>
  armadaRequest<MutualChatTask>("post", base, { data });
export const listMutualChats = (page = 1) =>
  armadaRequest<PageResponse<MutualChatTask>>("get", base, {
    params: { page, pageSize: 10 }
  });
export const getMutualChats = (id: number) =>
  armadaRequest<MutualChatTask>("get", `${base}/${id}`);
export const listMutualChatItems = (
  id: number,
  page: number,
  status?: number
) =>
  armadaRequest<PageResponse<MutualChatItem>>("get", `${base}/${id}/items`, {
    params: { page, pageSize: 20, status }
  });
export const stopMutualChats = (id: number) =>
  armadaRequest<void>("post", `${base}/${id}/stop`);
export const retryMutualChats = (id: number, confirmUnknown = false) =>
  armadaRequest<number>("post", `${base}/${id}/retry`, {
    params: { confirmUnknown }
  });
