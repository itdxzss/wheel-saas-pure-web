export interface GroupSendStatusMeta {
  label: string;
  tagType: "success" | "danger" | "info";
  className: string;
}

const UNCONFIRMED_META: GroupSendStatusMeta = {
  label: "未确认",
  tagType: "info",
  className: ""
};

const GROUP_SEND_STATUS_META: Record<string, GroupSendStatusMeta> = {
  NORMAL: {
    label: "正常",
    tagType: "success",
    className: ""
  },
  BANNED: {
    label: "封禁",
    tagType: "danger",
    className: ""
  },
  NO_PERMISSION: {
    label: "没有权限",
    tagType: "info",
    className: "group-status--no-permission"
  },
  UNCONFIRMED: UNCONFIRMED_META
};

export function groupSendStatusMeta(
  status: string | null | undefined
): GroupSendStatusMeta {
  return status ? (GROUP_SEND_STATUS_META[status] ?? UNCONFIRMED_META) : UNCONFIRMED_META;
}
