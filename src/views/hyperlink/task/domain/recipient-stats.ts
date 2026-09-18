import type {
  HyperlinkRecipientQuery,
  HyperlinkRecipientStatus,
  HyperlinkTaskSummary
} from "@/api/hyperlink-task-detail";

export interface RecipientFilters {
  phone: string;
  recipientCountryIso2: string;
  senderCountryIso2: string;
  failReason: string;
}

export interface SummaryCard {
  key: "success" | "delivered" | "failed" | "used" | "invalid" | "average";
  title: string;
  value: string;
  extra?: string;
  tooltip?: string;
  tone: "primary" | "success" | "danger" | "warning" | "info";
}

export const recipientPageSizes = [10, 20, 50, 100, 200];

export function emptyRecipientFilters(): RecipientFilters {
  return {
    phone: "",
    recipientCountryIso2: "",
    senderCountryIso2: "",
    failReason: ""
  };
}

export function defaultRecipientQuery(): HyperlinkRecipientQuery {
  return {
    page: 1,
    pageSize: 20,
    sortField: "id",
    sortOrder: "asc"
  };
}

export function applyRecipientFilters(
  filters: RecipientFilters,
  current: HyperlinkRecipientQuery
): HyperlinkRecipientQuery {
  return {
    ...current,
    page: 1,
    phone: filters.phone.trim() || undefined,
    recipientCountryIso2:
      filters.recipientCountryIso2.trim().toUpperCase() || undefined,
    senderCountryIso2:
      filters.senderCountryIso2.trim().toUpperCase() || undefined,
    failReason: filters.failReason.trim() || undefined
  };
}

export function summaryCards(summary: HyperlinkTaskSummary): SummaryCard[] {
  const success = Math.max(0, summary.successNum ?? 0);
  const delivered = Math.max(0, summary.deliveredNum ?? 0);
  const failed = Math.max(0, summary.failedNum ?? 0);
  const unregistered = Math.max(0, summary.unregisteredNum ?? 0);
  const used = Math.max(0, summary.usedAccountCount ?? 0);
  const invalid = Math.max(0, summary.invalidAccountCount ?? 0);
  const deliveredRate = success === 0 ? 0 : (delivered / success) * 100;
  const average = used === 0 ? 0 : success / used;
  return [
    {
      key: "success",
      title: "单钩",
      value: String(success),
      tooltip: "消息已发送到对方手机，手机关机或无网络时也算单钩。",
      tone: "primary"
    },
    {
      key: "delivered",
      title: "双钩 / 双钩率",
      value: String(delivered),
      extra: `${deliveredRate.toFixed(2)}%`,
      tooltip: "对方 WhatsApp 在线，设备 100% 收到；双钩可能延迟，仅供参考。",
      tone: "success"
    },
    {
      key: "failed",
      title: "失败 / 未开通 WS",
      value: String(failed),
      extra: String(unregistered),
      tone: "danger"
    },
    {
      key: "used",
      title: "使用号数",
      value: String(used),
      tone: "info"
    },
    {
      key: "invalid",
      title: "封号数",
      value: String(invalid),
      tone: "warning"
    },
    {
      key: "average",
      title: "号均发量",
      value: Number.isInteger(average) ? String(average) : average.toFixed(1),
      tone: "primary"
    }
  ];
}

export function recipientStatusLabel(
  status: HyperlinkRecipientStatus,
  businessCode?: string | null
): string {
  if (businessCode === "RESULT_PENDING") return "结果确认中";
  if (businessCode === "TARGET_UNAVAILABLE") return "目标无法发送";
  const labels: Record<HyperlinkRecipientStatus, string> = {
    PENDING: "处理中",
    SENDING: "处理中",
    SUCCESS: "发送成功",
    DELIVERED: "发送成功（已送达）",
    READ: "发送成功（已读）",
    FAILED: "未完成",
    UNREGISTERED: "目标无法发送"
  };
  return labels[status];
}

export function recipientStatusTagType(
  status: HyperlinkRecipientStatus
): "success" | "danger" | "warning" | "info" | "primary" {
  if (status === "FAILED" || status === "UNREGISTERED") return "danger";
  if (status === "PENDING") return "info";
  if (status === "SENDING") return "warning";
  if (status === "SUCCESS") return "primary";
  return "success";
}

export function countryFlag(iso2?: string | null): string {
  if (!iso2 || !/^[A-Z]{2}$/i.test(iso2)) return "🌐";
  return String.fromCodePoint(
    ...Array.from(iso2.toUpperCase(), letter => letter.charCodeAt(0) + 127397)
  );
}

export function isPermissionDenied(error: unknown): boolean {
  const candidate = error as {
    response?: { status?: number; data?: { code?: number } };
  };
  return (
    candidate?.response?.status === 403 ||
    candidate?.response?.data?.code === 40302
  );
}
