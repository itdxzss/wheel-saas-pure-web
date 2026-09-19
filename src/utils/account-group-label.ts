export interface AccountGroupCounts {
  id?: number;
  name: string;
  totalAccounts?: number | null;
  onlineAccounts?: number | null;
}

function countLabel(count?: number | null): string {
  return typeof count === "number" && Number.isFinite(count) && count >= 0
    ? String(count)
    : "—";
}

/** 数量未知时显示破折号，不能把已删除或尚未加载的分组伪装成空组。 */
export function formatAccountGroupLabel(group: AccountGroupCounts): string {
  return `${group.name}（总 ${countLabel(group.totalAccounts)} / 在线 ${countLabel(group.onlineAccounts)}）`;
}

export function resolveAccountGroupLabel(
  groups: readonly AccountGroupCounts[],
  id?: number | null,
  name?: string | null
): string {
  if (id == null && (!name || name === "-")) return name || "-";
  const matches = groups.filter(group =>
    id != null ? group.id === id : group.name === name
  );
  return formatAccountGroupLabel(
    matches.length === 1 ? matches[0] : { name: name || `分组 #${id}` }
  );
}

/** 老进群列表只有用 / 拼接的名称快照；只有唯一匹配时才关联当前数量。 */
export function resolveAccountGroupNamesLabel(
  groups: readonly AccountGroupCounts[],
  names?: string | null
): string {
  if (!names || names === "-") return names || "-";
  const memo = new Map<number, AccountGroupCounts[][]>();
  function match(offset: number): AccountGroupCounts[][] {
    if (offset === names!.length) return [[]];
    const cached = memo.get(offset);
    if (cached) return cached;
    const results: AccountGroupCounts[][] = [];
    for (const group of groups) {
      if (!group.name || !names!.startsWith(group.name, offset)) continue;
      const end = offset + group.name.length;
      if (end !== names!.length && names![end] !== "/") continue;
      if (end < names!.length && end + 1 === names!.length) continue;
      for (const rest of match(end === names!.length ? end : end + 1)) {
        results.push([group, ...rest]);
        if (results.length > 1) break;
      }
      if (results.length > 1) break;
    }
    memo.set(offset, results);
    return results;
  }
  const matches = match(0);
  return matches.length === 1
    ? matches[0].map(formatAccountGroupLabel).join("、")
    : `${names}（数量暂不可用）`;
}
