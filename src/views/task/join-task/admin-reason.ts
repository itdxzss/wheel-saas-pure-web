import type { JoinResultRow } from "@/api/join-task";

/** 兼容已保存的旧原因；未确认的结果不能显示成确定未生效。 */
export function adminReasonLabel(row: JoinResultRow): string {
  const reason = row.adminReason?.trim() ?? "";
  if (!reason) return "—";
  const ended = row.adminStatus === "FAILED";
  if (reason.includes("等待本群原有的可用管理员或角色确认")) {
    return ended
      ? "已进群，但未能完成管理员设置。请确认群内原管理员账号在线，且仍有管理权限。"
      : "已进群，正在等待可用的群管理员。请确认原管理员账号在线，且仍有管理权限。";
  }
  if (reason.includes("目标账号已不在群内")) {
    return "该账号已不在群内，无法设为管理员。请先确认账号是否被移出群组。";
  }
  if (reason.includes("目标群身份未确认")) {
    return "未能确认目标群，无法设置管理员。请检查群链接是否有效。";
  }
  if (reason.includes("进群账号不存在或协议身份无效")) {
    return "进群账号不可用，无法设置管理员。请检查该账号是否仍在账号列表中且可正常登录。";
  }
  if (reason.includes("重试次数已耗尽")) {
    return "多次尝试后，仍未确认该账号成为管理员。请在群内核实管理员名单。";
  }
  if (reason.startsWith("设置管理员超时")) {
    return "等待超时，暂时无法确认是否已设为管理员。请先查看群内管理员名单，再决定是否重新操作。";
  }
  if (reason.includes("群成员查询异常")) {
    return "暂时无法获取群成员信息，系统正在重新查询。";
  }
  if (reason === "等待管理员命令发送结果") {
    return "正在处理管理员设置，请稍候。";
  }
  const suggestions: Record<string, string> = {
    ACCOUNT_NOT_ONLINE: "请确认操作管理员账号在线。",
    GROUP_PERMISSION_DENIED: "请确认操作账号仍是该群管理员。",
    GROUP_BANNED: "群组当前不可用，请检查群组状态。",
    FORBIDDEN: "操作被拒绝，请检查操作账号和群组状态。"
  };
  const code = reason.split(/[:：]/).at(-1)?.trim() ?? "";
  if (reason.startsWith("设置结果待核实")) {
    return `尚未确认是否已设为管理员，系统正在核实。${suggestions[code] ?? "请稍后查看结果。"}`;
  }
  if (reason.startsWith("设置管理员失败")) {
    return `未能完成管理员设置。${suggestions[code] ?? "请检查群内管理员权限和账号状态，仍有问题请联系技术人员。"}`;
  }
  return reason;
}
