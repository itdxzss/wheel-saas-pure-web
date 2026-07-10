import type {
  MarketingSelection,
  MarketingTreeAccount
} from "@/api/marketing-task";

export type MarketingTreeNodeType = "account" | "group";

export interface MarketingTreeKeyParts {
  type: MarketingTreeNodeType;
  accountId: number;
  groupLinkId?: number;
}

export const accountTreeKey = (accountId: number): string =>
  `account:${accountId}`;

export const groupTreeKey = (accountId: number, groupLinkId: number): string =>
  `group:${accountId}:${groupLinkId}`;

export function parseMarketingTreeKey(
  key: string | number
): MarketingTreeKeyParts | null {
  const parts = String(key).split(":");
  if (parts[0] === "account" && parts.length === 2) {
    const accountId = Number(parts[1]);
    return Number.isFinite(accountId) ? { type: "account", accountId } : null;
  }
  if (parts[0] === "group" && parts.length === 3) {
    const accountId = Number(parts[1]);
    const groupLinkId = Number(parts[2]);
    return Number.isFinite(accountId) && Number.isFinite(groupLinkId)
      ? { type: "group", accountId, groupLinkId }
      : null;
  }
  return null;
}

export function defaultDynamicAccountIds(
  accounts: MarketingTreeAccount[]
): Set<number> {
  return new Set(
    accounts
      .filter(
        account =>
          (account.selectable ?? account.status === "ONLINE") &&
          account.groupsError !== true
      )
      .map(account => account.accountId)
  );
}

export function buildMarketingSelections(
  checkedKeys: Array<string | number>,
  dynamicAccountIds: Set<number>
): MarketingSelection[] {
  const selectedAccountIds = new Set<number>();
  const groupIdsByAccount = new Map<number, number[]>();

  for (const key of checkedKeys) {
    const parsed = parseMarketingTreeKey(key);
    if (!parsed) continue;
    selectedAccountIds.add(parsed.accountId);
    if (parsed.type !== "group" || parsed.groupLinkId == null) continue;
    const groupIds = groupIdsByAccount.get(parsed.accountId) ?? [];
    if (!groupIds.includes(parsed.groupLinkId)) {
      groupIds.push(parsed.groupLinkId);
    }
    groupIdsByAccount.set(parsed.accountId, groupIds);
  }

  for (const accountId of dynamicAccountIds) {
    selectedAccountIds.add(accountId);
  }

  const selections: MarketingSelection[] = [];
  for (const accountId of Array.from(selectedAccountIds).sort(
    (left, right) => left - right
  )) {
    if (dynamicAccountIds.has(accountId)) {
      selections.push({
        accountId,
        targetScope: "ACCOUNT_DYNAMIC",
        groupLinkIds: []
      });
      continue;
    }
    const groupLinkIds = groupIdsByAccount.get(accountId) ?? [];
    if (groupLinkIds.length > 0) {
      selections.push({
        accountId,
        targetScope: "GROUP_FIXED",
        groupLinkIds
      });
    }
  }
  return selections;
}
