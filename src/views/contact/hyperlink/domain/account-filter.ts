/**
 * 通讯录任务的账号筛选条件。
 *
 * **直接复用超链任务的筛选契约** `HyperlinkAccountFilter`：后端两个菜单已经共用同一个
 * `AccountHyperlinkCandidateService`，所有条件都真下推 SQL，前端再自建一套 snake_case
 * 形状只会让两边漂移。字段名、枚举取值、schema 版本一律以那份契约为准。
 *
 * 两处口径必须分清：
 * - `friendCountMin|Max` 是**双向好友**，两套协议都不暴露互加关系，`account_profile.friend_count`
 *   至今没有采集源，拿它筛号任何下界都会命中 0 个，**因此不渲染这个控件**。
 * - `contactNamedNumMin|Max` 是**通讯录里有名字的联系人数**，由通讯录全量快照落库时写进
 *   `account_profile.contact_named_num`，是本菜单唯一有真值的好友口径。
 *
 * 不再注入 `account_status` / `is_exported`：上游圈号的基线 WHERE 已经强制
 * `account_state = 2`（正常且未导出）。
 */

import type { HyperlinkAccountFilter } from "@/api/hyperlink-task";
import { createEmptyAccountFilter } from "@/views/hyperlink/task/domain/editor-rules";

/** 通讯录任务的筛选表单值，就是超链任务那份契约本身。 */
export type AccountFilterForm = HyperlinkAccountFilter;

/** 空表单：语义是「未限制（全部有效账号）」。 */
export function emptyAccountFilterForm(): AccountFilterForm {
  return createEmptyAccountFilter();
}

/** 除 schema 版本外的全部条件键，用于判空与摘要。 */
const CONDITION_KEYS: (keyof AccountFilterForm)[] = [
  "countryIso2s",
  "excludeCountryIso2s",
  "continent",
  "groupIds",
  "channelIds",
  "protocolId",
  "onlineStatus",
  "rotationStatus",
  "accountType",
  "platform",
  "widType",
  "importMode",
  "groupInviteAllowed",
  "phone",
  "importBatchId",
  "source",
  "contactNamedNumMin",
  "contactNamedNumMax",
  "retentionDaysMin",
  "retentionDaysMax",
  "registerDaysMin",
  "registerDaysMax",
  "createdAtFrom",
  "createdAtTo"
];

function isMeaningful(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === "string") {
    return value.trim() !== "";
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  // false 是一个真实条件（例如「禁止拉群」），不能被当成空值丢掉
  return true;
}

/**
 * 是否设置了任何条件。
 *
 * @param form 表单值
 * @returns 有任意一个真实条件时为 true
 */
export function hasAnyFilter(form: AccountFilterForm): boolean {
  return CONDITION_KEYS.some(key => isMeaningful(form[key]));
}

/**
 * 把表单值转成提交用的 JSON 字符串。
 *
 * 空字符串统一收敛成 null，避免把「没填」当成「筛了个空串」。
 *
 * @param form 表单值
 * @returns 提交用的 JSON 字符串
 */
export function toAccountFilterJson(form: AccountFilterForm): string {
  const payload: Record<string, unknown> = { filterSchemaVersion: 1 };
  for (const key of CONDITION_KEYS) {
    const value = form[key];
    payload[key] = isMeaningful(value)
      ? typeof value === "string"
        ? value.trim()
        : value
      : Array.isArray(value)
        ? []
        : null;
  }
  return JSON.stringify(payload);
}

/**
 * 把落库的筛选 JSON 回填成表单值。
 *
 * 解析失败一律退回空表单：一个坏掉的历史字段不该让整个抽屉打不开。
 *
 * @param raw 落库的 JSON 字符串
 * @returns 表单值
 */
export function parseAccountFilter(raw: string | null): AccountFilterForm {
  const form = emptyAccountFilterForm();
  if (!raw) {
    return form;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return form;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return form;
  }
  const source = parsed as Record<string, unknown>;
  for (const key of CONDITION_KEYS) {
    const value = source[key];
    if (value === undefined || value === null) {
      continue;
    }
    if (Array.isArray(form[key]) && !Array.isArray(value)) {
      continue;
    }
    (form as unknown as Record<string, unknown>)[key] = value;
  }
  return form;
}
