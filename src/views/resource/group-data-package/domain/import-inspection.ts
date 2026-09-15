export const GROUP_PACKAGE_MAX_PHONES = 100_000;
export const GROUP_PACKAGE_MAX_FILE_BYTES = 10 * 1024 * 1024;
export const GROUP_PACKAGE_SAMPLE =
  "66812345678A\n66887654321\n5511987654321\n";

export interface InspectedGroupPhone {
  phone: string;
  adminRequired: boolean;
  sourceLineNo: number;
}

export interface GroupPackageInspection {
  totalRows: number;
  validRows: number;
  duplicatedRows: number;
  invalidRows: number;
  blankRows: number;
  adminCount: number;
  exceedsLimit: boolean;
  preview: InspectedGroupPhone[];
  errors: { lineNo: number; reason: string }[];
}

/** 与既有拉群 TXT 格式保持一致：尾 A/a、常见展示字符、首次顺序。 */
export function inspectGroupPackageText(text: string): GroupPackageInspection {
  const phones = new Map<string, InspectedGroupPhone>();
  const result: GroupPackageInspection = {
    totalRows: 0,
    validRows: 0,
    duplicatedRows: 0,
    invalidRows: 0,
    blankRows: 0,
    adminCount: 0,
    exceedsLimit: false,
    preview: [],
    errors: []
  };
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r\n|[\n\v\f\r\u0085\u2028\u2029]/);
  if (lines.at(-1) === "") lines.pop();
  result.totalRows = lines.length;
  for (const [index, raw] of lines.entries()) {
    const line = raw.trim();
    if (!line) {
      result.blankRows++;
      continue;
    }
    const adminRequired = /[Aa]$/.test(line);
    const phone = (adminRequired ? line.slice(0, -1) : line).replace(
      /[+\s()\-]/g,
      ""
    );
    if (!/^\d{7,15}$/.test(phone)) {
      result.invalidRows++;
      if (result.errors.length < 10)
        result.errors.push({
          lineNo: index + 1,
          reason: "须为 7–15 位手机号，可在末尾加 A/a"
        });
      continue;
    }
    const existing = phones.get(phone);
    if (existing) {
      result.duplicatedRows++;
      existing.adminRequired ||= adminRequired;
      continue;
    }
    phones.set(phone, { phone, adminRequired, sourceLineNo: index + 1 });
  }
  result.validRows = phones.size;
  result.adminCount = [...phones.values()].filter(
    phone => phone.adminRequired
  ).length;
  result.exceedsLimit = phones.size > GROUP_PACKAGE_MAX_PHONES;
  result.preview = [...phones.values()].slice(0, 5);
  return result;
}

export async function inspectGroupPackageFile(
  file: File
): Promise<GroupPackageInspection> {
  if (!file.name.toLowerCase().endsWith(".txt"))
    throw new Error("请选择 UTF-8 编码的 TXT 文件");
  if (file.name.length > 255) throw new Error("文件名不能超过 255 个字符");
  if (!file.size) throw new Error("TXT 文件不能为空");
  if (file.size > GROUP_PACKAGE_MAX_FILE_BYTES)
    throw new Error("文件不能超过 10 MB，请拆分后导入");
  const text = new TextDecoder("utf-8", { fatal: true }).decode(
    await file.arrayBuffer()
  );
  const result = inspectGroupPackageText(text);
  if (!result.totalRows) throw new Error("TXT 文件没有号码行");
  return result;
}
