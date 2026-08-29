/**
 * 发送间隔的预设与归一化。
 *
 * 间隔语义：同一个账号给两个好友发消息之间至少等几秒；实际发送时在区间内随机取值。
 * 单位是**带一位小数的秒**——落成整数会把「最快 0.1 秒」这一档做没。
 */

export interface IntervalPreset {
  key: "fastest" | "recommended" | "steady" | "safe";
  label: string;
  min: number;
  max: number;
}

/** 滑杆下限，同时也是最小值输入的下限。 */
export const INTERVAL_SLIDER_MIN = 0.1;

/** 滑杆上限。最大值输入允许到 60，比滑杆更宽。 */
export const INTERVAL_SLIDER_MAX = 30;

/** 最大值输入的硬上限。 */
export const INTERVAL_INPUT_MAX = 60;

/** 四档预设，取值与竞品逐字一致。 */
export const INTERVAL_PRESETS: IntervalPreset[] = [
  { key: "fastest", label: "最快", min: 0.1, max: 0.1 },
  { key: "recommended", label: "平台推荐", min: 0.5, max: 1 },
  { key: "steady", label: "稳健", min: 1, max: 3 },
  { key: "safe", label: "防风控", min: 3, max: 5 }
];

/** 保留一位小数，四舍五入。 */
function oneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 把用户输入的区间归一成可提交的值。
 *
 * @param min 最小间隔秒
 * @param max 最大间隔秒
 * @returns 归一后的区间；max 始终 >= min
 */
export function normalizeInterval(
  min: number,
  max: number
): { min: number; max: number } {
  const safeMin = oneDecimal(
    clamp(
      Number.isFinite(min) ? min : INTERVAL_SLIDER_MIN,
      INTERVAL_SLIDER_MIN,
      INTERVAL_INPUT_MAX
    )
  );
  const safeMax = oneDecimal(
    clamp(
      Number.isFinite(max) ? max : safeMin,
      INTERVAL_SLIDER_MIN,
      INTERVAL_INPUT_MAX
    )
  );
  // 用户把大小值填反时裁剪而不是报错，竞品就是这个行为
  return { min: safeMin, max: Math.max(safeMin, safeMax) };
}

/**
 * 反查当前区间落在哪一档预设，用于让对应按钮高亮。
 *
 * @param min 最小间隔秒
 * @param max 最大间隔秒
 * @returns 命中的预设 key；自定义区间返回 null
 */
export function matchIntervalPreset(
  min: number,
  max: number
): IntervalPreset["key"] | null {
  const found = INTERVAL_PRESETS.find(
    preset => preset.min === oneDecimal(min) && preset.max === oneDecimal(max)
  );
  return found ? found.key : null;
}
