import type { GroupMember, GroupMemberOpResult } from "@/api/group";

export type GroupMemberAction = "promote" | "demote" | "kick";

/**
 * 把后端已确认成功的成员操作合并到当前抽屉成员列表。
 *
 * metadata 刷新是异步任务，操作后立即重新请求详情会读到旧快照并造成角色回弹；
 * 这里只应用逐成员结果中明确为 OK 的项目，失败或未知项目保持原状。
 */
export function applyGroupMemberActionResult(
  members: GroupMember[],
  action: GroupMemberAction,
  result: GroupMemberOpResult
): GroupMember[] {
  const succeeded = new Set(
    (result.results ?? [])
      .filter(item => item.status === "OK")
      .map(item => item.jid)
  );
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
