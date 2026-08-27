import type { DataPackageImportMode } from "@/api/hyperlink-data-package";

export const DATA_PACKAGE_IMPORT_MAX_ROWS = 100_000;
export const DATA_PACKAGE_IMPORT_SAMPLE = `66812345678
66887654321
5511987654321
`;

export interface DataPackageForbiddenCountryInspection {
  count: number;
  label: string;
  prefix: string;
}

export interface DataPackageTxtInspection {
  duplicatedRowCount: number;
  filename: string;
  forbiddenCountries: DataPackageForbiddenCountryInspection[];
  invalidRowCount: number;
  nonEmptyRowCount: number;
  validPhoneCount: number;
}

const PHONE_PATTERN = /^\d{6,20}$/;
const FORBIDDEN_COUNTRIES = [
  { prefix: "60", label: "马来西亚" },
  { prefix: "65", label: "新加坡" },
  { prefix: "86", label: "中国" },
  { prefix: "852", label: "中国香港" },
  { prefix: "853", label: "中国澳门" },
  { prefix: "886", label: "中国台湾" }
] as const;
const FORBIDDEN_COUNTRY_MATCH_ORDER = [...FORBIDDEN_COUNTRIES].sort(
  (left, right) => right.prefix.length - left.prefix.length
);

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

  const uniquePhones = new Set<string>();
  const forbiddenCounts = new Map<string, number>();
  let duplicatedRowCount = 0;
  let invalidRowCount = 0;
  let nonEmptyRowCount = 0;
  for (const sourceLine of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const phone = sourceLine.trim();
    if (!phone) continue;
    nonEmptyRowCount += 1;
    if (nonEmptyRowCount > DATA_PACKAGE_IMPORT_MAX_ROWS) {
      throw new Error(
        `单次最多导入 ${DATA_PACKAGE_IMPORT_MAX_ROWS.toLocaleString("en-US")} 条`
      );
    }
    if (!PHONE_PATTERN.test(phone)) {
      invalidRowCount += 1;
      continue;
    }
    if (uniquePhones.has(phone)) {
      duplicatedRowCount += 1;
      continue;
    }
    uniquePhones.add(phone);
    const forbiddenCountry = FORBIDDEN_COUNTRY_MATCH_ORDER.find(country =>
      phone.startsWith(country.prefix)
    );
    if (forbiddenCountry) {
      forbiddenCounts.set(
        forbiddenCountry.prefix,
        (forbiddenCounts.get(forbiddenCountry.prefix) ?? 0) + 1
      );
    }
  }
  if (nonEmptyRowCount === 0) {
    throw new Error("TXT 文件不能为空");
  }
  return {
    duplicatedRowCount,
    filename: file.name,
    forbiddenCountries: FORBIDDEN_COUNTRIES.flatMap(country => {
      const count = forbiddenCounts.get(country.prefix);
      return count ? [{ ...country, count }] : [];
    }),
    invalidRowCount,
    nonEmptyRowCount,
    validPhoneCount: uniquePhones.size
  };
}
