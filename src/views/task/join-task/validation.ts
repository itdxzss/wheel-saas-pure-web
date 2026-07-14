export interface ModeTwoDistributionInput {
  selectedAccountCount: number;
  executorAccountCount: number;
  linksPerAccount: number;
  validLinkCount: number;
}

const STRICT_HTTPS_INVITE_LINK =
  /^https:\/\/chat\.whatsapp\.com\/([A-Za-z0-9]+)\/?$/i;

export function canonicalizeStrictJoinLink(link: string): string | null {
  const match = STRICT_HTTPS_INVITE_LINK.exec(link);
  return match ? `https://chat.whatsapp.com/${match[1]}` : null;
}

export function countStrictValidJoinLinks(links: string[]): number {
  const canonicalLinks = new Set<string>();
  for (const link of links) {
    const canonical = canonicalizeStrictJoinLink(link);
    if (canonical) canonicalLinks.add(canonical);
  }
  return canonicalLinks.size;
}

function positiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

export function validateModeTwoDistribution(
  input: ModeTwoDistributionInput
): string | null {
  if (
    !positiveInteger(input.executorAccountCount) ||
    !positiveInteger(input.linksPerAccount)
  ) {
    return "执行账号数量和每账号链接数必须为正整数";
  }
  if (input.selectedAccountCount !== input.executorAccountCount) {
    return "勾选账号数量与填写的执行账号数量不一致，请重新填写";
  }
  const capacity = input.executorAccountCount * input.linksPerAccount;
  if (input.validLinkCount > capacity) {
    return "有效群链接数量超过任务容量，请补充账号或提高每账号链接上限";
  }
  return null;
}
