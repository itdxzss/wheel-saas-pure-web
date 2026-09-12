import { stringify } from "qs";
import { armadaRequest } from "@/api/armada";
import { http } from "@/utils/http";

export interface PageResult<T> {
  list: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type ResourceAssetScope = "HYPERLINK" | "SCRIPT";

export interface ResourceAssetGroup {
  id: number;
  groupName: string;
  assetCount: number;
}

export interface ResourceAsset {
  id: number;
  assetName: string;
  groupId: number | null;
  assetScope: number | null;
  contentUrl: string;
  tags: string[];
  sizeBytes: number;
  width: number | null;
  height: number | null;
  referenceCount: number;
  createdBy: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface ResourceAssetListQuery {
  page?: number;
  pageSize?: 12 | 24 | 48 | 96;
  assetName?: string;
  tags?: string[];
  selectableOnly?: boolean;
  scope?: ResourceAssetScope;
  groupId?: number;
}

export interface ResourceAssetUpdateRequest {
  assetName: string;
  tags: string[];
}

export function listResourceAssets(
  query: ResourceAssetListQuery = {}
): Promise<PageResult<ResourceAsset>> {
  return armadaRequest<PageResult<ResourceAsset>>(
    "get",
    "/api/resource-assets",
    {
      params: { ...query, scope: query.scope ?? "HYPERLINK" },
      paramsSerializer: {
        serialize: params => stringify(params, { arrayFormat: "repeat" })
      }
    }
  );
}

export function getResourceAsset(
  id: number,
  scope: ResourceAssetScope = "HYPERLINK"
): Promise<ResourceAsset> {
  return armadaRequest<ResourceAsset>("get", `/api/resource-assets/${id}`, {
    params: { scope }
  });
}

export async function listResourceAssetTags(
  scope: ResourceAssetScope = "HYPERLINK"
): Promise<string[]> {
  const result = await armadaRequest<{ tags: string[] }>(
    "get",
    "/api/resource-assets/tags",
    { params: { scope } }
  );
  return result.tags;
}

export function uploadResourceAsset(
  file: File,
  tags: string[] = [],
  onUploadProgress?: (progress: number) => void,
  groupId?: number | null,
  scope: ResourceAssetScope = "HYPERLINK"
): Promise<ResourceAsset> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("scope", scope);
  formData.append("tags", JSON.stringify(tags));
  if (groupId) formData.append("groupId", String(groupId));
  return armadaRequest<ResourceAsset>(
    "post",
    "/api/resource-assets",
    {
      data: formData,
      timeout: 45_000,
      onUploadProgress: event => {
        if (!event.total || !onUploadProgress) return;
        onUploadProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
    {
      beforeRequestCallback: config => {
        delete config.headers["Content-Type"];
      }
    }
  );
}

export function updateResourceAsset(
  id: number,
  data: ResourceAssetUpdateRequest,
  scope: ResourceAssetScope = "HYPERLINK"
): Promise<ResourceAsset> {
  return armadaRequest<ResourceAsset>("put", `/api/resource-assets/${id}`, {
    data,
    params: { scope }
  });
}

export function deleteResourceAsset(
  id: number,
  scope: ResourceAssetScope = "HYPERLINK"
): Promise<void> {
  return armadaRequest<void>("delete", `/api/resource-assets/${id}`, {
    params: { scope }
  });
}

export function resourceAssetContentUrl(
  id: number,
  scope: ResourceAssetScope = "HYPERLINK"
): string {
  return `/api/resource-assets/${id}/content?scope=${scope}`;
}

export function downloadResourceAsset(
  id: number,
  scope: ResourceAssetScope = "HYPERLINK"
): Promise<Blob> {
  return http.request<Blob>("get", resourceAssetContentUrl(id, scope), {
    responseType: "blob"
  });
}

/** 查询当前租户分组，包含尚未上传素材的空分组。 */
export function listResourceAssetGroups(
  scope: ResourceAssetScope = "HYPERLINK"
): Promise<ResourceAssetGroup[]> {
  return armadaRequest<ResourceAssetGroup[]>(
    "get",
    "/api/resource-assets/groups",
    { params: { scope } }
  );
}

export function createResourceAssetGroup(
  groupName: string,
  scope: ResourceAssetScope = "HYPERLINK"
): Promise<ResourceAssetGroup> {
  return armadaRequest<ResourceAssetGroup>(
    "post",
    "/api/resource-assets/groups",
    {
      data: { groupName },
      params: { scope }
    }
  );
}

/** 删除分组并将其中的图片移至未分组，保留图片与引用。 */
export function deleteResourceAssetGroup(
  id: number,
  scope: ResourceAssetScope = "HYPERLINK"
): Promise<void> {
  return armadaRequest<void>("delete", `/api/resource-assets/groups/${id}`, {
    params: { scope }
  });
}

export function moveResourceAssets(
  assetIds: number[],
  groupId: number | null,
  scope: ResourceAssetScope = "HYPERLINK"
): Promise<void> {
  return armadaRequest<void>("put", "/api/resource-assets/group", {
    data: { assetIds, groupId },
    params: { scope }
  });
}
