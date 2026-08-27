import type { DataPackageImportMode } from "@/api/hyperlink-data-package";

export const DATA_PACKAGE_IMPORT_MAX_ROWS = 5000;

export interface DataPackageTxtInspection {
  filename: string;
  nonEmptyRowCount: number;
}

export function dataPackageImportModeLabel(
  mode: DataPackageImportMode
): string {
  return mode === "APPEND" ? "追加导入" : "覆盖导入";
}

export async function inspectDataPackageTxt(
  file: File
): Promise<DataPackageTxtInspection> {
  if (file.name.length > 255) {
    throw new Error("TXT 文件名不能超过 255 个字符");
  }
  if (!file.name.toLowerCase().endsWith(".txt")) {
    throw new Error("仅支持 UTF-8 编码的 .txt 文件");
  }
  if (file.size === 0) {
    throw new Error("TXT 文件不能为空");
  }

  const text = await file.text();
  if (text.includes("\uFFFD")) {
    throw new Error("TXT 文件必须使用 UTF-8 编码");
  }
  const nonEmptyRowCount = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter(line => line.trim().length > 0).length;
  if (nonEmptyRowCount === 0) {
    throw new Error("TXT 文件不能为空");
  }
  if (nonEmptyRowCount > DATA_PACKAGE_IMPORT_MAX_ROWS) {
    throw new Error(`单次最多导入 ${DATA_PACKAGE_IMPORT_MAX_ROWS} 条`);
  }
  return { filename: file.name, nonEmptyRowCount };
}
