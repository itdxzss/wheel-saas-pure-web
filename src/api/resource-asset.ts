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

export interface ResourceAsset {
  id: number;
  assetName: string;
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
      params: query,
      paramsSerializer: {
        serialize: params => stringify(params, { arrayFormat: "repeat" })
      }
    }
  );
}

export function getResourceAsset(id: number): Promise<ResourceAsset> {
  return armadaRequest<ResourceAsset>("get", `/api/resource-assets/${id}`);
}

export async function listResourceAssetTags(): Promise<string[]> {
  const result = await armadaRequest<{ tags: string[] }>(
    "get",
    "/api/resource-assets/tags"
  );
  return result.tags;
}

export function uploadResourceAsset(
  file: File,
  tags: string[] = [],
  onUploadProgress?: (progress: number) => void
): Promise<ResourceAsset> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("tags", JSON.stringify(tags));
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
  data: ResourceAssetUpdateRequest
): Promise<ResourceAsset> {
  return armadaRequest<ResourceAsset>("put", `/api/resource-assets/${id}`, {
    data
  });
}

export function deleteResourceAsset(id: number): Promise<void> {
  return armadaRequest<void>("delete", `/api/resource-assets/${id}`);
}

export function resourceAssetContentUrl(id: number): string {
  return `/api/resource-assets/${id}/content`;
}

export function downloadResourceAsset(id: number): Promise<Blob> {
  return http.request<Blob>("get", resourceAssetContentUrl(id), {
    responseType: "blob"
  });
}
