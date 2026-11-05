import {
  mutualTaskStatus,
  mutualReason as contactReason,
  validMutualForm as validGroups
} from "./mutual-contact-display";
export { mutualTaskStatus };
export const mutualItemStatus: Record<number, string> = {
  1: "待发送",
  2: "已提交",
  3: "发送成功",
  4: "失败",
  5: "待确认",
  6: "已取消"
};
const reasons: Record<string, string> = {
  RESULT_TIMEOUT: "未收到确定结果，可人工重试；该账号仍可继续发送后续消息",
  SEND_RESULT_UNKNOWN: "发送结果待确认，重试可能重复发送",
  UNKNOWN: "发送结果待确认，重试可能重复发送",
  EMPTY_MESSAGE_ID: "未取得消息编号，发送结果待确认",
  SEND_FAILED: "发送失败，可重试",
  ENQUEUE_REJECTED: "发送命令未被接受，可重试",
  BACKEND_UNAVAILABLE: "协议后端不可用，可重试"
};
export function mutualReason(code?: string): string {
  return code ? (reasons[code] ?? contactReason(code)) : "—";
}
/** 与后端固定纯文本及任务间隔边界一致。 */
export function validMutualForm(form: {
  leftGroupId?: number;
  rightGroupId?: number;
  intervalSeconds: number;
  leftText: string;
  rightText: string;
}): boolean {
  return (
    validGroups(form.leftGroupId, form.rightGroupId, form.intervalSeconds) &&
    form.intervalSeconds >= 1 &&
    [form.leftText, form.rightText].every(
      text => text.trim().length > 0 && text.trim().length <= 1000
    )
  );
}
