import type { IpAllocationMode } from "@/api/resource-ip-mapping";

export const MIXED_COUNTRY_VALUE = "MIXED";
export const MIXED_COUNTRY_LABEL = "混合（不限国家）";

export interface IpAllocationModeOption {
  label: string;
  value: IpAllocationMode;
  description: string;
}

export const ipAllocationModeOptions: IpAllocationModeOption[] = [
  {
    label: "智能分配",
    value: "smart",
    description: "按所选国家进入对应国家池"
  },
  {
    label: "混合国家",
    value: "mixed",
    description: `进入${MIXED_COUNTRY_LABEL}池`
  }
];

const importLineExample = "代理地址:端口:用户名:密码";

function lineError(lineNo: number, reason: string): string {
  return `第 ${lineNo} 行：${reason}`;
}

function isPositiveInteger(value: string): boolean {
  return /^[1-9]\d*$/.test(value);
}

/**
 * 前端先做一遍轻量格式门禁，避免格式错误文件进入真实代理抽检。
 *
 * 这里故意只返回第一条错误：用户修掉当前行后再继续检查下一处，和“遇到第一个报错就不继续”的产品口径一致。
 */
export function validateIpImportTextFormat(text: string): string[] {
  const lines = text.split(/\r\n|\n|\r/);

  for (let index = 0; index < lines.length; index += 1) {
    const lineNo = index + 1;
    const raw = lines[index].trim();

    if (!raw) {
      return [lineError(lineNo, "格式错误，空行不允许")];
    }

    const parts = raw.split(":");
    if (parts.length !== 4) {
      return [lineError(lineNo, `格式错误，应为 ${importLineExample}`)];
    }

    const [host, portText, username, password] = parts.map(part => part.trim());
    if (!host || !username || !password) {
      return [lineError(lineNo, "格式错误，存在空字段")];
    }

    if (!isPositiveInteger(portText)) {
      return [lineError(lineNo, "格式错误，端口必须为正整数")];
    }
  }

  return [];
}
