import type { MarketingOccupancyDisplayType } from "@/api/account";
import type { AccountGroupMarketingOccupancy } from "@/api/account-group";

export interface MarketingOccupancyOption {
  label: string;
  value: MarketingOccupancyDisplayType;
  color: string;
}

/** 需求确认的占用类型、名称与颜色，统一供筛选项和分组标签复用。 */
export const marketingOccupancyOptions: MarketingOccupancyOption[] = [
  { label: "空闲", value: "FREE", color: "#A2A8B2" },
  { label: "单纯营销", value: "SIMPLE_MARKETING", color: "#6F9FEF" },
  {
    label: "拉群营销",
    value: "GROUP_PULL_MARKETING",
    color: "#9A84E8"
  },
  { label: "拉群模式二", value: "GROUP_PULL_MODE_2", color: "#E7A15A" },
  { label: "拉群模式三", value: "GROUP_PULL_MODE_3", color: "#58B7C4" },
  { label: "其他营销", value: "OTHER_MARKETING", color: "#BE87C7" },
  { label: "暂停占用", value: "PAUSED", color: "#766C82" },
  { label: "待释放", value: "RELEASING", color: "#71869D" }
];

const FREE_META = marketingOccupancyOptions[0];

/** 后端返回未知值时按空闲灰色兜底，避免页面出现无样式标签。 */
export function marketingOccupancyMeta(
  type?: string | null
): Pick<MarketingOccupancyOption, "label" | "color"> {
  const option = marketingOccupancyOptions.find(item => item.value === type);
  return {
    label: option?.label ?? FREE_META.label,
    color: option?.color ?? FREE_META.color
  };
}

/** 当前后端已接入的统一营销任务业务类型。 */
export const occupiedBusinessTypeOptions = [
  { label: "单纯营销", value: 1 },
  { label: "拉群营销", value: 2 }
];

export interface MarketingOccupancyDetailSession {
  invalidate: () => void;
  select: (groupId: number) => Promise<AccountGroupMarketingOccupancy | null>;
}

/**
 * 创建账号分组占用详情的页面会话。
 *
 * 同组并发点击复用一个请求；切换分组或列表刷新后，旧请求即使晚返回也不会被选中或写回缓存。
 */
export function createMarketingOccupancyDetailSession(
  loader: (groupId: number) => Promise<AccountGroupMarketingOccupancy>
): MarketingOccupancyDetailSession {
  const cache = new Map<number, AccountGroupMarketingOccupancy>();
  const pending = new Map<number, Promise<AccountGroupMarketingOccupancy>>();
  let generation = 0;
  let selectionVersion = 0;

  async function load(groupId: number) {
    const cached = cache.get(groupId);
    if (cached) return cached;

    const loadGeneration = generation;
    let request = pending.get(groupId);
    if (!request) {
      request = loader(groupId);
      pending.set(groupId, request);
      const clearPending = () => {
        if (pending.get(groupId) === request) pending.delete(groupId);
      };
      void request.then(clearPending, clearPending);
    }

    const detail = await request;
    if (loadGeneration === generation) cache.set(groupId, detail);
    return detail;
  }

  return {
    invalidate: () => {
      generation += 1;
      selectionVersion += 1;
      cache.clear();
      pending.clear();
    },
    select: async groupId => {
      const currentSelection = ++selectionVersion;
      const currentGeneration = generation;
      const detail = await load(groupId);
      return currentSelection === selectionVersion &&
        currentGeneration === generation
        ? detail
        : null;
    }
  };
}
