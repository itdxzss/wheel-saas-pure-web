export const RESOURCE_ASSET_MAX_FILES = 100;
export const RESOURCE_ASSET_MAX_BYTES = 500 * 1024;
export const RESOURCE_ASSET_MAX_TAGS = 20;

export interface ResourceAssetFileValidation {
  valid: boolean;
  message: string;
}

export interface ResourceAssetUploadItem {
  file: File;
  status: "pending" | "uploading" | "failed";
  progress: number;
  message: string;
}

export interface ResourceAssetBatchResult {
  succeeded: ResourceAssetUploadItem[];
  failed: ResourceAssetUploadItem[];
}

type ResourceAssetUploader = (
  file: File,
  tags: string[],
  onProgress: (progress: number) => void
) => Promise<unknown>;

export function normalizeResourceAssetTags(values: string[]): string[] {
  const normalized: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const tag = value.trim();
    if (!tag || seen.has(tag)) continue;
    if (tag.length > 64) throw new Error("标签最长 64 个字符");
    if (normalized.length >= RESOURCE_ASSET_MAX_TAGS) {
      throw new Error("每个素材最多设置 20 个标签");
    }
    seen.add(tag);
    normalized.push(tag);
  }
  return normalized;
}

export async function validateResourceAssetFile(
  file: File
): Promise<ResourceAssetFileValidation> {
  if (
    !/\.jpe?g$/i.test(file.name) ||
    file.type.toLowerCase() !== "image/jpeg"
  ) {
    return { valid: false, message: `${file.name} 仅支持 JPG/JPEG 图片` };
  }
  if (file.size > RESOURCE_ASSET_MAX_BYTES) {
    return { valid: false, message: `${file.name} 不能超过 500KB` };
  }
  if (file.size < 5) {
    return { valid: false, message: `${file.name} 不是有效的 JPEG 文件` };
  }
  const header = new Uint8Array(await file.slice(0, 3).arrayBuffer());
  const tail = new Uint8Array(await file.slice(-2).arrayBuffer());
  const valid =
    header[0] === 0xff &&
    header[1] === 0xd8 &&
    header[2] === 0xff &&
    tail[0] === 0xff &&
    tail[1] === 0xd9;
  return valid
    ? { valid: true, message: "" }
    : { valid: false, message: `${file.name} 不是有效的 JPEG 文件` };
}

export function formatAssetBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  return `${(value / 1024).toFixed(value >= 100 * 1024 ? 0 : 1)} KB`;
}

export async function uploadResourceAssetBatch(
  items: ResourceAssetUploadItem[],
  tags: string[],
  uploader: ResourceAssetUploader,
  errorMessage: (error: unknown) => string
): Promise<ResourceAssetBatchResult> {
  const succeeded: ResourceAssetUploadItem[] = [];
  const failed: ResourceAssetUploadItem[] = [];
  for (const item of items) {
    item.status = "uploading";
    item.progress = 0;
    item.message = "";
    try {
      await uploader(item.file, tags, progress => {
        item.progress = progress;
      });
      item.progress = 100;
      succeeded.push(item);
    } catch (error) {
      item.status = "failed";
      item.message = errorMessage(error);
      failed.push(item);
    }
  }
  return { succeeded, failed };
}
