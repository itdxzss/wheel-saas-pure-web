/** 标签颜色沿用 Element Plus 的 tag type，对应关系只表达"哪一档"，不表达好坏。 */
export type TierTagType = "danger" | "info" | "warning" | "primary" | "success";

export const tierTagType: Record<string, TierTagType> = {
  SUSPICIOUS: "danger",
  UNTIERED: "info",
  TIER_0: "warning",
  TIER_1: "primary",
  TIER_2: "success",
  TIER_3: "success"
};

/** 展示顺序：档位高低是推断，这里只用于稳定排版。 */
export const tierOrder = [
  "SUSPICIOUS",
  "UNTIERED",
  "TIER_0",
  "TIER_1",
  "TIER_2",
  "TIER_3"
];

const tierText: Record<string, string> = {
  SUSPICIOUS: "可疑",
  UNTIERED: "未分档"
};

export function tierLabel(tier?: string | null): string {
  if (!tier) return "-";
  return tierText[tier] ?? tier;
}

export const checkModeText: Record<number, string> = {
  1: "每个号查自己",
  2: "探针号代查"
};

export const taskStatusText: Record<number, string> = {
  1: "执行中",
  2: "已停止",
  3: "已完成",
  4: "部分失败"
};

export const taskStatusTagType: Record<number, TierTagType> = {
  1: "primary",
  2: "info",
  3: "success",
  4: "warning"
};

export const itemStatusText: Record<number, string> = {
  1: "待查",
  2: "查询中",
  3: "成功",
  4: "失败",
  5: "不可查",
  6: "已取消"
};

export const changeText: Record<number, string> = {
  0: "首次检测",
  1: "不变",
  2: "上升",
  3: "下降",
  4: "有变化（方向不明）",
  5: "本次未查到"
};

export const changeTagType: Record<number, TierTagType> = {
  0: "info",
  1: "info",
  2: "success",
  3: "danger",
  4: "warning",
  5: "info"
};

const reasonText: Record<string, string> = {
  EXECUTOR_OFFLINE: "发起账号离线",
  NO_PROBE_ONLINE: "没有在线的探针号",
  EMPTY_RESPONSE: "返回为空，疑似被限流",
  NOT_ALLOWED: "不可查（可能已封号）",
  TIMEOUT: "查询超时",
  UNSUPPORTED_BACKEND: "协议暂不支持",
  ACCOUNT_ACCESS_CHANGED: "账号已删除或归属已变化",
  ACCOUNT_IDENTITY_CHANGED: "账号凭据或协议身份已变化",
  EXECUTOR_IDENTITY_CHANGED: "发起账号身份已变化",
  ACCESS_REVOKED: "发起人的编辑权限已失效",
  PROTOCOL_ERROR: "协议查询失败",
  GRAPHQL_ERROR: "服务器拒绝查询",
  IQ_ERROR: "协议查询失败",
  INVALID_RESPONSE: "服务器返回格式异常",
  TASK_STOPPED: "检测已停止"
};

export function reasonLabel(code?: string | null): string {
  if (!code) return "-";
  return reasonText[code] ?? code;
}

export const userTypeText: Record<string, string> = {
  PERSONAL: "个人号",
  BUSINESS: "商业号"
};

/** 已知档位维持原排版；服务器新档位也展示，不静默丢掉计数。 */
export function tierEntries(
  counts: Record<string, number> = {}
): { tier: string; count: number }[] {
  const tiers = [
    ...tierOrder,
    ...Object.keys(counts)
      .filter(tier => !tierOrder.includes(tier))
      .sort()
  ];
  return tiers
    .filter(tier => counts[tier] > 0)
    .map(tier => ({ tier, count: counts[tier] }));
}
