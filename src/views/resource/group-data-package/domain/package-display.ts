import type {
  GroupDataPackage,
  GroupDataPackageExportStatus,
  GroupDataPackageMetrics,
  GroupDataPackagePhoneStatus
} from "@/api/group-data-package";

export interface GroupPackageSearch {
  name: string;
  countryIso2: string;
  continent: string;
  usageBusiness: string;
  createdRange: [Date, Date] | null;
}

export type PackageAction =
  | "import"
  | "edit"
  | "reset"
  | "delete"
  | "phones"
  | "imports";

export const continentOptions = [
  { value: "ASIA", label: "亚洲" },
  { value: "EUROPE", label: "欧洲" },
  { value: "AFRICA", label: "非洲" },
  { value: "NORTH_AMERICA", label: "北美洲" },
  { value: "SOUTH_AMERICA", label: "南美洲" },
  { value: "OCEANIA", label: "大洋洲" },
  { value: "ANTARCTICA", label: "南极洲" }
];

export function continentLabel(value: string | null): string {
  return (
    continentOptions.find(item => item.value === value)?.label ?? value ?? "—"
  );
}

export function businessLabel(value: string): string {
  return (
    { STANDARD_PULL: "标准拉群", GROUP_PULL_MARKETING: "建群营销" }[value] ??
    value
  );
}

export const phoneStatusLabels: Record<GroupDataPackagePhoneStatus, string> = {
  UNUSED: "未使用",
  CLAIMED: "已领取",
  SUCCESS: "入群成功",
  RETRYABLE_FAILED: "可重试失败",
  PRIVACY_REJECTED: "隐私拒绝",
  UNREGISTERED: "未注册",
  UNKNOWN: "结果待确认"
};

export const exportOptions: {
  value: GroupDataPackageExportStatus;
  label: string;
}[] = [
  { value: "all", label: "全部号码" },
  { value: "unused", label: "仅未使用" },
  { value: "success", label: "仅入群成功" },
  { value: "failed", label: "仅入群失败" },
  { value: "privacy_rejected", label: "仅隐私拒绝" }
];

export function exportCount(
  metrics: GroupDataPackageMetrics,
  status: GroupDataPackageExportStatus
): number {
  return {
    all: metrics.totalCount,
    unused: metrics.unusedCount,
    success: metrics.successCount,
    failed: metrics.failedCount,
    privacy_rejected: metrics.privacyRejectedCount
  }[status];
}

export function retryableCount(metrics: GroupDataPackageMetrics): number {
  return Math.max(
    0,
    metrics.failedCount -
      metrics.privacyRejectedCount -
      metrics.unregisteredCount
  );
}

export function sumPackageMetrics(
  rows: GroupDataPackage[]
): GroupDataPackageMetrics {
  return rows.reduce(
    (result, row) => {
      for (const key of Object.keys(
        result
      ) as (keyof GroupDataPackageMetrics)[]) {
        result[key] += row.metrics[key];
      }
      return result;
    },
    {
      totalCount: 0,
      unusedCount: 0,
      claimedCount: 0,
      successCount: 0,
      failedCount: 0,
      privacyRejectedCount: 0,
      unregisteredCount: 0,
      unknownCount: 0
    }
  );
}

export const packageTableColumns = [
  { label: "ID", prop: "id" },
  { label: "数据包", prop: "name" },
  { label: "国家", prop: "country" },
  { label: "大洲", prop: "continent" },
  { label: "消费业务", prop: "businesses" },
  { label: "号码使用情况", prop: "usage" },
  { label: "点击 / 点击率", prop: "clicks" },
  { label: "可导出", prop: "exportable" },
  { label: "创建时间", prop: "createdAt" }
];

/** CSV 的自由文本单元格禁止被电子表格解释为公式。 */
export function packageCsvCell(value: unknown): string {
  const raw = String(value ?? "");
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}
