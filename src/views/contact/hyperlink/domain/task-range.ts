import type { ContactTaskListItem } from "@/api/contact-task";
import { parseAccountFilter } from "./account-filter";

/** 账号范围列最多平铺 3 个标签，其余折叠成 +N。 */
const RANGE_TAG_LIMIT = 3;

interface RangeTag {
  text: string;
  excluded: boolean;
  iso2?: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  ANDROID_PERSONAL: "Android 个人",
  ANDROID_BUSINESS_PRIMARY: "Android 商业主设备",
  ANDROID_BUSINESS_COMPANION: "Android 商业分身",
  IOS_PERSONAL: "iOS 个人",
  IOS_BUSINESS_PRIMARY: "iOS 商业主设备",
  IOS_BUSINESS_COMPANION: "iOS 商业分身"
};

const CONTINENT_LABELS: Record<string, string> = {
  ASIA: "亚洲",
  AFRICA: "非洲",
  EUROPE: "欧洲",
  NORTH_AMERICA: "北美洲",
  SOUTH_AMERICA: "南美洲",
  OCEANIA: "大洋洲",
  ANTARCTICA: "南极洲"
};

const ROTATION_LABELS: Record<number, string> = {
  0: "未轮换",
  1: "轮换中",
  2: "已完成",
  3: "轮换失败"
};

const SOURCE_LABELS: Record<number, string> = {
  0: "买量",
  1: "自登",
  2: "买入",
  3: "转入",
  4: "群扫码"
};

/** 把落库的筛选 JSON 还原成一串可读标签。 */
export function rangeTags(row: ContactTaskListItem): RangeTag[] {
  const filter = parseAccountFilter(row.accountFilter);
  const tags: RangeTag[] = [];
  for (const iso2 of filter.countryIso2s) {
    tags.push({ text: iso2, excluded: false, iso2 });
  }
  for (const iso2 of filter.excludeCountryIso2s) {
    tags.push({ text: `排除 ${iso2}`, excluded: true, iso2 });
  }
  if (filter.groupIds.length > 0) {
    tags.push({ text: `分组 ${filter.groupIds.length} 个`, excluded: false });
  }
  if (filter.channelIds.length > 0) {
    tags.push({
      text: `渠道 ${filter.channelIds.length} 个`,
      excluded: false
    });
  }
  if (filter.protocolId) {
    tags.push({ text: `协议 ${filter.protocolId}`, excluded: false });
  }
  if (filter.accountType != null) {
    tags.push({
      text: filter.accountType === 2 ? "商业号" : "个人号",
      excluded: false
    });
  }
  if (filter.phone) {
    tags.push({ text: `号码 ${filter.phone}`, excluded: false });
  }
  if (filter.registerDaysMin != null) {
    tags.push({ text: `注册≥${filter.registerDaysMin}天`, excluded: false });
  }
  if (filter.registerDaysMax != null) {
    tags.push({ text: `注册≤${filter.registerDaysMax}天`, excluded: false });
  }
  if (filter.contactNamedNumMin != null) {
    tags.push({ text: `好友≥${filter.contactNamedNumMin}`, excluded: false });
  }
  if (filter.contactNamedNumMax != null) {
    tags.push({ text: `好友≤${filter.contactNamedNumMax}`, excluded: false });
  }
  if (filter.onlineStatus) {
    tags.push({
      text: filter.onlineStatus === "ONLINE" ? "在线" : "离线",
      excluded: false
    });
  }
  if (filter.platform) {
    tags.push({ text: PLATFORM_LABELS[filter.platform], excluded: false });
  }
  if (filter.continent) {
    tags.push({ text: CONTINENT_LABELS[filter.continent], excluded: false });
  }
  if (filter.groupInviteAllowed != null) {
    tags.push({
      text: filter.groupInviteAllowed ? "允许拉群" : "禁止拉群",
      excluded: false
    });
  }
  if (filter.retentionDaysMin != null) {
    tags.push({ text: `存活≥${filter.retentionDaysMin}天`, excluded: false });
  }
  if (filter.retentionDaysMax != null) {
    tags.push({ text: `存活≤${filter.retentionDaysMax}天`, excluded: false });
  }
  if (filter.rotationStatus != null) {
    tags.push({
      text: ROTATION_LABELS[filter.rotationStatus],
      excluded: false
    });
  }
  if (filter.importMode) {
    tags.push({
      text: filter.importMode === "six_segment" ? "六段" : "全参",
      excluded: false
    });
  }
  if (filter.widType) {
    tags.push({
      text: filter.widType === "web5" ? "分身设备" : "主设备",
      excluded: false
    });
  }
  if (filter.source != null) {
    tags.push({ text: SOURCE_LABELS[filter.source], excluded: false });
  }
  if (filter.importBatchId != null) {
    tags.push({ text: `批次 ${filter.importBatchId}`, excluded: false });
  }
  if (filter.createdAtFrom != null || filter.createdAtTo != null) {
    tags.push({ text: "限定创建时间", excluded: false });
  }
  return tags;
}

export function visibleRangeTags(row: ContactTaskListItem): RangeTag[] {
  return rangeTags(row).slice(0, RANGE_TAG_LIMIT);
}

export function hiddenRangeCount(row: ContactTaskListItem): number {
  return Math.max(0, rangeTags(row).length - RANGE_TAG_LIMIT);
}

export function flagUrl(iso2: string): string {
  return `https://flagcdn.com/w20/${iso2.toLowerCase()}.png`;
}
