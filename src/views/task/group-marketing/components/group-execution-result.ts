export interface GroupExecutionResultMeta {
  label: string;
  tagType: "success" | "danger" | "info";
  tagged: boolean;
}

const EMPTY_META: GroupExecutionResultMeta = {
  label: "-",
  tagType: "info",
  tagged: false
};

const RESULT_META: Record<string, GroupExecutionResultMeta> = {
  SUCCESS: {
    label: "发送成功",
    tagType: "success",
    tagged: true
  },
  FAILED: {
    label: "发送失败",
    tagType: "danger",
    tagged: true
  }
};

export function groupExecutionResultMeta(
  result: string | null | undefined
): GroupExecutionResultMeta {
  return result ? (RESULT_META[result] ?? EMPTY_META) : EMPTY_META;
}
