import { armadaRequest } from "@/api/armada";
import type { PageResponse } from "@/api/account";

export interface GroupFolderRow {
  id: number;
  name: string;
  systemBuiltin: boolean;
  groupCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface GroupFolderOption {
  id: number;
  name: string;
}

export interface GroupFolderFilterOption extends GroupFolderOption {
  /** 群组列表未删除记录数，包含所有健康状态。 */
  groupCount: number;
}

export interface GroupFolderFilterOptions {
  totalGroupCount: number;
  unassignedGroupCount: number;
  folders: GroupFolderFilterOption[];
}

export interface GroupFolderWriteRequest {
  name: string;
}

export interface GroupFolderDeleteResult {
  deletedFolderCount: number;
  ungroupedGroupCount: number;
}

export interface GroupFolderListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
}

export function listGroupFolders(
  params: GroupFolderListQuery = {}
): Promise<PageResponse<GroupFolderRow>> {
  return armadaRequest<PageResponse<GroupFolderRow>>(
    "get",
    "/api/group-folders",
    { params }
  );
}

export function listGroupFolderOptions(): Promise<GroupFolderOption[]> {
  return armadaRequest<GroupFolderOption[]>(
    "get",
    "/api/group-folders/options"
  );
}

export function listGroupFolderFilterOptions(): Promise<GroupFolderFilterOptions> {
  return armadaRequest<GroupFolderFilterOptions>(
    "get",
    "/api/group-folders/filter-options"
  );
}

export function createGroupFolder(
  data: GroupFolderWriteRequest
): Promise<GroupFolderRow> {
  return armadaRequest<GroupFolderRow>("post", "/api/group-folders", {
    data
  });
}

export function updateGroupFolder(
  id: number,
  data: GroupFolderWriteRequest
): Promise<void> {
  return armadaRequest<void>("patch", `/api/group-folders/${id}`, { data });
}

export function batchDeleteGroupFolders(
  ids: number[]
): Promise<GroupFolderDeleteResult> {
  return armadaRequest<GroupFolderDeleteResult>(
    "post",
    "/api/group-folders/batch-delete",
    { data: { ids } }
  );
}
