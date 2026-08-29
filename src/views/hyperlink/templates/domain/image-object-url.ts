export interface ImageObjectUrlController {
  replace(blob: Blob): string;
  clear(): void;
  current(): string;
}

interface ObjectUrlApi {
  createObjectURL(blob: Blob): string;
  revokeObjectURL(url: string): void;
}

export function createImageObjectUrlController(
  objectUrlApi: ObjectUrlApi = URL
): ImageObjectUrlController {
  let currentUrl = "";
  return {
    replace(blob: Blob): string {
      if (currentUrl) objectUrlApi.revokeObjectURL(currentUrl);
      currentUrl = objectUrlApi.createObjectURL(blob);
      return currentUrl;
    },
    clear(): void {
      if (!currentUrl) return;
      objectUrlApi.revokeObjectURL(currentUrl);
      currentUrl = "";
    },
    current(): string {
      return currentUrl;
    }
  };
}
