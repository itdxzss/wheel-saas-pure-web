function formatMinutes(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/** 按固定上下百分之二十规则生成逐料随机等待提示。 */
export function materialEntryIntervalHint(baseMinutes: number): string {
  const minimum = formatMinutes(baseMinutes * 0.8);
  const maximum = formatMinutes(baseMinutes * 1.2);
  return `实际每次随机等待 ${minimum}～${maximum} 分钟（±20%）`;
}
