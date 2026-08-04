import { armadaRequest } from "@/api/armada";

export type CommonGroupMemberType = "CONTROLLED" | "CUSTOM" | "EMPTY";
export type CommonGroupDefaultMode = "DEFAULT" | "OPEN" | "CLOSED";

export interface CommonGroupTaskCreateRequest {
  managerGroupId: number;
  creatorAutoLeave: boolean;
  memberType: CommonGroupMemberType;
  memberGroupId: number | null;
  memberCount: number;
  speed: "NORMAL";
  groupFolderId: number | null;
  groupName: string | null;
  groupCount: number;
  startIndex: number;
  successMoveGroupId: number | null;
  failureMoveGroupId: number | null;
  muteMode: CommonGroupDefaultMode;
  editPermission: CommonGroupDefaultMode;
  approveMode: CommonGroupDefaultMode;
  disappearingMessage:
    | "DEFAULT"
    | "ONE_DAY"
    | "SEVEN_DAYS"
    | "NINETY_DAYS"
    | "OFF";
  linkPermission: "ALL" | "ADMIN_ONLY" | null;
}

export interface CommonGroupTaskCreateResult {
  taskId: string;
  createdAt: number;
}

export function createCommonGroupTask(
  data: CommonGroupTaskCreateRequest
): Promise<CommonGroupTaskCreateResult> {
  return armadaRequest<CommonGroupTaskCreateResult>(
    "post",
    "/api/common-group-tasks",
    { data }
  );
}
