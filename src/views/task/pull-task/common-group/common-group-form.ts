import type { CommonGroupTaskCreateRequest } from "@/api/common-group-task";

export type CommonGroupMemberType = "CONTROLLED" | "CUSTOM" | "EMPTY";
export type CommonGroupDefaultMode = "DEFAULT" | "OPEN" | "CLOSED";

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
  addMembersPermission: CommonGroupDefaultMode;
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
    addMembersPermission: "DEFAULT"
  };
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 1;
}

function generatedCommonGroupName(
  template: string,
  groupCount: number,
  no: number
): string {
  if (template.includes("{no}")) {
    return template.replaceAll("{no}", String(no));
  }
  return groupCount === 1 ? template : `${template}-${no}`;
}

export function validateCommonGroupForm(
  form: CommonGroupForm
): CommonGroupFormErrors {
  const errors: CommonGroupFormErrors = {};
  if (!form.managerGroupId) errors.managerGroupId = "请选择管理员分组";
  if (form.memberType !== "CUSTOM" && !form.memberGroupId) {
    errors.memberGroupId = "请选择成员分组";
  }
  if (
    form.memberType === "CONTROLLED" &&
    (!isPositiveInteger(form.memberCount) || form.memberCount > 1024)
  ) {
    errors.memberCount = "成员数量必须为 1 至 1024 的整数";
  }
  if (!isPositiveInteger(form.groupCount) || form.groupCount > 1000) {
    errors.groupCount = "建群数量必须为 1 至 1000 的整数";
  }
  if (form.groupName.trim() && !isPositiveInteger(form.startIndex)) {
    errors.startIndex = "开始编号必须为大于等于 1 的整数";
  }
  if (form.groupName.trim().length > 128) {
    errors.groupName = "群名称最多 128 个字符";
  } else if (
    isPositiveInteger(form.groupCount) &&
    form.groupCount <= 1000 &&
    isPositiveInteger(form.startIndex) &&
    Array.from({ length: form.groupCount }, (_, index) =>
      generatedCommonGroupName(
        form.groupName.trim(),
        form.groupCount,
        form.startIndex + index
      )
    ).some(name => name.length > 128)
  ) {
    errors.groupName = "生成后的群名称最多 128 个字符";
  }
  const effectiveMemberCount =
    form.memberType === "EMPTY" ? 1 : form.memberCount;
  if (
    isPositiveInteger(form.groupCount) &&
    isPositiveInteger(effectiveMemberCount) &&
    form.groupCount * effectiveMemberCount > 10000
  ) {
    errors.groupCount = "计划群成员快照不能超过 10000 条，请减少建群或成员数量";
  }
  return errors;
}

export function commonGroupNamePreview(form: CommonGroupForm): string[] {
  const count = Math.min(Math.max(form.groupCount, 0), 5);
  const template = form.groupName.trim();
  return Array.from({ length: count }, (_, index) => {
    const no = form.startIndex + index;
    return template
      ? generatedCommonGroupName(template, form.groupCount, no)
      : `自动生成（第 ${index + 1} 个群）`;
  });
}

export function toCommonGroupCreateRequest(
  form: CommonGroupForm
): CommonGroupTaskCreateRequest {
  return {
    adminAccountGroupId: Number(form.managerGroupId),
    creatorLeavePolicy: form.creatorAutoLeave ? "LEAVE" : "KEEP",
    memberSource:
      form.memberType === "EMPTY" ? "EMPTY_GROUP" : "CONTROLLED_GROUP",
    memberAccountGroupId: Number(form.memberGroupId),
    memberCount: form.memberType === "EMPTY" ? 1 : form.memberCount,
    speed: "NORMAL",
    folderId: form.groupFolderId ? Number(form.groupFolderId) : null,
    groupNameTemplate: form.groupName.trim(),
    groupCount: form.groupCount,
    startNo: form.groupName.trim() ? form.startIndex : 1,
    successMigrationGroupId: form.successMoveGroupId
      ? Number(form.successMoveGroupId)
      : null,
    failedMigrationGroupId: form.failureMoveGroupId
      ? Number(form.failureMoveGroupId)
      : null,
    settings: {
      sendMessagesAllowed: form.muteMode !== "CLOSED",
      editGroupSettingsAllowed: form.editPermission === "OPEN",
      addMembersAllowed: form.addMembersPermission !== "CLOSED",
      joinApprovalEnabled: form.approveMode === "OPEN",
      ephemeralDurationSeconds: (
        {
          DEFAULT: 0,
          OFF: 0,
          ONE_DAY: 86400,
          SEVEN_DAYS: 604800,
          NINETY_DAYS: 7776000
        } as const
      )[form.disappearingMessage]
    }
  };
}
