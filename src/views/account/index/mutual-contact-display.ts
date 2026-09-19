export const mutualTaskStatus: Record<number, string> = {
  1: "执行中",
  2: "已停止",
  3: "全部成功",
  4: "需关注"
};
export const mutualItemStatus: Record<number, string> = {
  1: "待执行",
  2: "等待结果",
  3: "成功",
  4: "失败",
  5: "结果待确认",
  6: "已取消"
};
const reasons: Record<string, string> = {
  ACCOUNT_UNAVAILABLE: "账号当前离线或受限，恢复后可重试",
  ACCOUNT_NOT_ONLINE: "协议账号不在线",
  ACCOUNT_ACCESS_CHANGED: "账号已删除或归属已变化",
  ACCESS_REVOKED: "任务发起人的权限已失效",
  ACCOUNT_IDENTITY_CHANGED: "账号协议身份或号码已变化",
  RESULT_TIMEOUT: "尚未收到确定结果，该账号后续操作等待确认",
  TIMEOUT: "保存超时，结果待确认",
  APP_STATE_NOT_READY: "账号联系人同步状态未就绪",
  APP_STATE_CONFLICT: "联系人同步版本冲突",
  CONTACT_NOT_REGISTERED: "目标号码未注册 WhatsApp",
  TASK_STOPPED: "任务停止，尚未执行",
  TEMPORARY_FAILURE: "协议临时错误",
  PROTOCOL_RESULT_UNCONFIRMED: "协议结果未确认"
};
export function mutualReason(code?: string): string {
  return code ? (reasons[code] ?? code) : "—";
}
export function validMutualForm(
  left?: number,
  right?: number,
  interval?: number
): boolean {
  return (
    Number.isSafeInteger(left) &&
    left > 0 &&
    Number.isSafeInteger(right) &&
    right > 0 &&
    left !== right &&
    Number.isInteger(interval) &&
    interval >= 0 &&
    interval <= 3600
  );
}
