import { armadaRequest } from "@/api/armada";
import type { PageResponse } from "@/api/account-group";

export interface MutualContactRequest {
  leftGroupId: number;
  rightGroupId: number;
  intervalSeconds: number;
  requestId?: string;
  previewToken?: string;
}
export interface MutualContactGroup {
  id: number;
  name: string;
  total: number;
  eligible: number;
  excluded: number;
}
export interface MutualContactPreview {
  left: MutualContactGroup;
  right: MutualContactGroup;
  pairCount: number;
  operationCount: number;
  previewToken: string;
}
export interface MutualContactStats {
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
export interface MutualContactTask {
  id: number;
  leftGroupName: string;
  rightGroupName: string;
  leftCount: number;
  rightCount: number;
  intervalSeconds: number;
  status: number;
  createdAt: number;
  stats: MutualContactStats;
}
export interface MutualContactItem {
  id: number;
  actorId: number;
  targetId: number;
  actorPhone: string;
  targetPhone: string;
  protocolBackend: string;
  status: number;
  attemptNo: number;
  retryable: boolean;
  reasonCode?: string;
  submittedAt?: number;
  resultAt?: number;
}
const base = "/api/accounts/mutual-contact-tasks";
export const previewMutualContacts = (data: MutualContactRequest) =>
  armadaRequest<MutualContactPreview>("post", `${base}/preview`, { data });
export const createMutualContacts = (data: MutualContactRequest) =>
  armadaRequest<MutualContactTask>("post", base, { data });
export const listMutualContacts = (page = 1) =>
  armadaRequest<PageResponse<MutualContactTask>>("get", base, {
    params: { page, pageSize: 10 }
  });
export const getMutualContacts = (id: number) =>
  armadaRequest<MutualContactTask>("get", `${base}/${id}`);
export const listMutualContactItems = (
  id: number,
  page: number,
  status?: number
) =>
  armadaRequest<PageResponse<MutualContactItem>>("get", `${base}/${id}/items`, {
    params: { page, pageSize: 20, status }
  });
export const stopMutualContacts = (id: number) =>
  armadaRequest<void>("post", `${base}/${id}/stop`);
export const retryMutualContacts = (id: number) =>
  armadaRequest<number>("post", `${base}/${id}/retry-failed`);
