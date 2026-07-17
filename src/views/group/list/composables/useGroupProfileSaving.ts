import { updateGroupRemark, updateGroupSubject } from "@/api/group";

export interface GroupProfileValues {
  groupName: string;
  remark: string;
}

export interface GroupProfileSaveResult {
  field: keyof GroupProfileValues;
  label: string;
  value: string;
  settled: PromiseSettledResult<void>;
}

export async function saveChangedGroupProfile(
  groupId: number,
  values: GroupProfileValues,
  baseline: GroupProfileValues
): Promise<GroupProfileSaveResult[]> {
  const operations: Array<
    Omit<GroupProfileSaveResult, "settled"> & {
      request: Promise<void>;
    }
  > = [];
  if (values.groupName !== baseline.groupName) {
    operations.push({
      field: "groupName",
      label: "群名称",
      value: values.groupName,
      request: updateGroupSubject(groupId, values.groupName)
    });
  }
  if (values.remark !== baseline.remark) {
    operations.push({
      field: "remark",
      label: "群备注",
      value: values.remark,
      request: updateGroupRemark(groupId, values.remark)
    });
  }
  const settled = await Promise.allSettled(
    operations.map(operation => operation.request)
  );
  return operations.map(({ request: _request, ...operation }, index) => ({
    ...operation,
    settled: settled[index]
  }));
}
