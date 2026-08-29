/**
 * 通讯录任务的账号筛选条件：表单值 ↔ 提交 JSON。
 *
 * **只暴露后端真正会应用的条件。** `ContactAccountFilterNormalizer` 的白名单放行约 20 个键，
 * 但真正参与圈号 SQL 的 `AccountFilterCriteria` 只实现了下面这些。画出一个存了却不生效的
 * 控件，比没有这个控件更糟——用户以为筛了，实际没筛。
 *
 * 另外 `friend_count_min|max`（双向好友数）**永远不渲染**：两套协议都不暴露双向好友标记，
 * 该值恒为 0，筛出来的结果没有意义（交接文档 §5.3 硬约束）。
 *
 * 提交用 snake_case，后端归一化后落库为 camelCase，因此回填要按 camelCase 读。
 */

/** 后端会真正应用的筛选键，提交时用的 snake_case 形态。 */
export const EFFECTIVE_FILTER_KEYS = [
  "country_iso2s",
  "exclude_country_iso2s",
  "group_ids",
  "channel_ids",
  "protocol_id",
  "account_type",
  "phone",
  "register_days_min",
  "register_days_max",
  "group_invite_allowed"
] as const;

export interface AccountFilterForm {
  country_iso2s: string[];
  exclude_country_iso2s: string[];
  group_ids: number[];
  channel_ids: number[];
  protocol_id: string;
  account_type: number | null;
  phone: string;
  register_days_min: number | null;
  register_days_max: number | null;
  group_invite_allowed: boolean | null;
}

/** 空表单：语义是「未限制（全部有效账号）」。 */
export function emptyAccountFilterForm(): AccountFilterForm {
  return {
    country_iso2s: [],
    exclude_country_iso2s: [],
    group_ids: [],
    channel_ids: [],
    protocol_id: "",
    account_type: null,
    phone: "",
    register_days_min: null,
    register_days_max: null,
    group_invite_allowed: null
  };
}

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
  // false 是一个真实条件，不能被当成空值丢掉
  return true;
}

/**
 * 把表单值转成提交用的 JSON 字符串。
 *
 * 条件全空时返回 `"{}"`，语义是「未限制」。只要有一个真实条件，就必须强制注入
 * `account_status: 'normal'` 与 `is_exported: false`。
 * **不注入 `stranger_muted`**——这是与超链任务的真实差异，不是笔误。
 *
 * @param form 表单值
 * @returns 提交用的 JSON 字符串
 */
export function toAccountFilterJson(form: AccountFilterForm): string {
  const payload: Record<string, unknown> = {};
  for (const key of EFFECTIVE_FILTER_KEYS) {
    const value = (form as Record<string, unknown>)[key];
    if (isMeaningful(value)) {
      payload[key] = typeof value === "string" ? value.trim() : value;
    }
  }
  if (Object.keys(payload).length === 0) {
    return "{}";
  }
  payload.account_status = "normal";
  payload.is_exported = false;
  return JSON.stringify(payload);
}

/** 提交键 → 落库键的对应；后端归一化输出 camelCase。 */
const STORED_KEYS: Record<keyof AccountFilterForm, string> = {
  country_iso2s: "countryIso2s",
  exclude_country_iso2s: "excludeCountryIso2s",
  group_ids: "groupIds",
  channel_ids: "channelIds",
  protocol_id: "protocolId",
  account_type: "accountType",
  phone: "phone",
  register_days_min: "registerDaysMin",
  register_days_max: "registerDaysMax",
  group_invite_allowed: "groupInviteAllowed"
};

/**
 * 把落库的筛选 JSON 回填成表单值。
 *
 * 解析失败一律退回空表单：一个坏掉的历史字段不该让整个抽屉打不开。
 *
 * @param raw 落库的 JSON 字符串
 * @returns 表单值
 */
export function parseAccountFilter(
  raw: string | null | undefined
): AccountFilterForm {
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
  for (const key of Object.keys(STORED_KEYS) as (keyof AccountFilterForm)[]) {
    const value = source[STORED_KEYS[key]];
    if (value !== undefined && value !== null) {
      (form as Record<string, unknown>)[key] = value;
    }
  }
  return form;
}

/**
 * 该筛选是否限定了范围，供「账号范围」区块判断要不要显示「全部有效账号」。
 *
 * @param form 表单值
 * @returns 有任一真实条件时为 true
 */
export function hasAnyFilter(form: AccountFilterForm): boolean {
  return toAccountFilterJson(form) !== "{}";
}
