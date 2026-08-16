import type { GroupMember, GroupMemberOpResult } from "@/api/group";

export type GroupMemberAction = "promote" | "demote" | "kick";

export interface GroupMemberActionFailure {
  jid: string;
  status: string;
  reason: string | null;
}

export interface GroupMemberActionOutcome {
  complete: boolean;
  failures: GroupMemberActionFailure[];
  retryJids: string[];
  succeededJids: string[];
}

/**
 * 逐个核对本次请求的 JID。顶层 ok/partial 仅是汇总字段，不能替代成员结果。
 *
 * JID 按协议值精确、区分大小写匹配；缺失、重复或非 OK 的结果都保留重试。
 */
export function reconcileGroupMemberActionResult(
  requestedJids: readonly string[],
  result: GroupMemberOpResult
): GroupMemberActionOutcome {
  const requested = [...new Set(requestedJids)];
  const succeededJids: string[] = [];
  const retryJids: string[] = [];
  const failures: GroupMemberActionFailure[] = [];
  const results = result.results ?? [];

  for (const jid of requested) {
    const matches = results.filter(item => item.jid === jid);
    if (matches.length === 1 && matches[0].status === "OK") {
      succeededJids.push(jid);
      continue;
    }

    retryJids.push(jid);
    if (matches.length === 0) {
      failures.push({
        jid,
        status: "MISSING",
        reason: "后端未返回该成员的操作结果"
      });
    } else if (matches.length > 1) {
      failures.push({
        jid,
        status: "AMBIGUOUS",
        reason: "后端返回了重复的成员操作结果"
      });
    } else {
      failures.push({
        jid,
        status: matches[0].status,
        reason: matches[0].reason
      });
    }
  }

  return {
    complete: requested.length > 0 && succeededJids.length === requested.length,
    failures,
    retryJids,
    succeededJids
  };
}

/**
 * 把后端已确认成功的成员操作合并到当前抽屉成员列表。
 *
 * 这里只应用已经与本次请求逐项核对过的成功 JID，失败或未知项目保持原状。
 */
export function applyGroupMemberActionResult(
  members: GroupMember[],
  action: GroupMemberAction,
  succeededJids: readonly string[]
): GroupMember[] {
  const succeeded = new Set(succeededJids);
  if (succeeded.size === 0) return members;
  if (action === "kick") {
    return members.filter(member => !succeeded.has(member.jid));
  }
  return members.map(member => {
    if (!succeeded.has(member.jid)) return member;
    const promoted = action === "promote";
    return {
      ...member,
      role: promoted ? "ADMIN" : "MEMBER",
      roleText: promoted ? "管理员" : "成员",
      locked: false
    };
  });
}
