import type { GroupListRow } from "@/api/group";

const MEMBERSHIP_JOINED = 2;
const MEMBERSHIP_OWNED = 3;

export function groupMemberFallbackReason(row: GroupListRow): string | null {
  if (
    row.membershipState !== MEMBERSHIP_JOINED &&
    row.membershipState !== MEMBERSHIP_OWNED
  ) {
    return "目标未进群，获取不到成员信息";
  }
  if (!row.groupJid) {
    return "群 JID 未解析，请先预览或等待账号群同步";
  }
  return null;
}
