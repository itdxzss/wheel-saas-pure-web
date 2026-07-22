export interface GroupMembershipStatusMeta {
  label: string;
  tagType: "success" | "warning" | "danger" | "info";
}

const UNCONFIRMED_META: GroupMembershipStatusMeta = {
  label: "未确认",
  tagType: "info"
};

const MEMBERSHIP_META: Record<string, GroupMembershipStatusMeta> = {
  IN_GROUP: { label: "在群", tagType: "success" },
  UNCONFIRMED: UNCONFIRMED_META,
  KICKED_OUT: { label: "被踢出", tagType: "danger" },
  LEFT: { label: "已主动退出", tagType: "warning" },
  NOT_IN_GROUP: { label: "已不在群", tagType: "info" }
};

export function groupMembershipStatusMeta(
  status: string | null | undefined
): GroupMembershipStatusMeta {
  return status
    ? (MEMBERSHIP_META[status] ?? UNCONFIRMED_META)
    : UNCONFIRMED_META;
}
