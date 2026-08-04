import type {
  CommonGroupDefaultMode,
  CommonGroupMemberType,
  CommonGroupTaskCreateRequest
} from "@/api/common-group-task";

export interface CommonGroupForm {
  managerGroupId: number | "";
  creatorAutoLeave: boolean;
  memberType: CommonGroupMemberType;
  memberGroupId: number | "";
  memberCount: number;
  speed: "NORMAL" | "FAST";
  groupFolderId: number | "";
  groupName: string;
  groupCount: number;
  startIndex: number;
  successMoveGroupId: number | "";
  failureMoveGroupId: number | "";
  muteMode: CommonGroupDefaultMode;
  editPermission: CommonGroupDefaultMode;
  approveMode: CommonGroupDefaultMode;
  disappearingMessage:
    | "DEFAULT"
    | "ONE_DAY"
    | "SEVEN_DAYS"
    | "NINETY_DAYS"
    | "OFF";
  linkPermission: "" | "ALL" | "ADMIN_ONLY";
}

export type CommonGroupFormErrors = Partial<
  Record<keyof CommonGroupForm, string>
>;

export function createCommonGroupForm(): CommonGroupForm {
  return {
    managerGroupId: "",
    creatorAutoLeave: false,
    memberType: "CONTROLLED",
    memberGroupId: "",
    memberCount: 1,
    speed: "NORMAL",
    groupFolderId: "",
    groupName: "",
    groupCount: 1,
    startIndex: 1,
    successMoveGroupId: "",
    failureMoveGroupId: "",
    muteMode: "DEFAULT",
    editPermission: "DEFAULT",
    approveMode: "DEFAULT",
    disappearingMessage: "DEFAULT",
    linkPermission: ""
  };
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 1;
}

export function validateCommonGroupForm(
  form: CommonGroupForm
): CommonGroupFormErrors {
  const errors: CommonGroupFormErrors = {};
  if (!form.managerGroupId) errors.managerGroupId = "请选择管理员分组";
  if (form.memberType === "CONTROLLED" && !form.memberGroupId) {
    errors.memberGroupId = "请选择成员分组";
  }
  if (
    form.memberType === "CONTROLLED" &&
    !isPositiveInteger(form.memberCount)
  ) {
    errors.memberCount = "成员数量必须为大于等于 1 的整数";
  }
  if (!isPositiveInteger(form.groupCount) || form.groupCount > 20) {
    errors.groupCount = "建群数量必须为 1 至 20 的整数";
  }
  if (!isPositiveInteger(form.startIndex)) {
    errors.startIndex = "开始编号必须为大于等于 1 的整数";
  }
  if (form.groupName.trim().length > 60) {
    errors.groupName = "群名称最多 60 个字符";
  }
  return errors;
}

export function commonGroupNamePreview(form: CommonGroupForm): string[] {
  const prefix = form.groupName.trim() || "群名称";
  const count = Math.min(Math.max(form.groupCount, 0), 5);
  return Array.from(
    { length: count },
    (_, index) => `${prefix}${form.startIndex + index}`
  );
}

export function toCommonGroupCreateRequest(
  form: CommonGroupForm
): CommonGroupTaskCreateRequest {
  return {
    managerGroupId: Number(form.managerGroupId),
    creatorAutoLeave: form.creatorAutoLeave,
    memberType: form.memberType,
    memberGroupId:
      form.memberType === "CONTROLLED" ? Number(form.memberGroupId) : null,
    memberCount: form.memberType === "CONTROLLED" ? form.memberCount : 0,
    speed: "NORMAL",
    groupFolderId: form.groupFolderId ? Number(form.groupFolderId) : null,
    groupName: form.groupName.trim() || null,
    groupCount: form.groupCount,
    startIndex: form.startIndex,
    successMoveGroupId: form.successMoveGroupId
      ? Number(form.successMoveGroupId)
      : null,
    failureMoveGroupId: form.failureMoveGroupId
      ? Number(form.failureMoveGroupId)
      : null,
    muteMode: form.muteMode,
    editPermission: form.editPermission,
    approveMode: form.approveMode,
    disappearingMessage: form.disappearingMessage,
    linkPermission: form.linkPermission || null
  };
}
