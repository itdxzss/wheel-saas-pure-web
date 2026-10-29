import { armadaRequest } from "@/api/armada";

/** 可导入安卓号分身的 WB 环境（后端 WB_TARGETS 配置）。 */
export interface WbTarget {
  envId: string;
  name: string;
}

export interface WbMember {
  id: number;
  username: string;
  status: string;
  deviceCount: number;
  deviceMax: number;
  /** 目标 WB 关闭影子连接时只能登录 1 个。 */
  shadowEnabled: boolean;
}

export interface WbCompanionCreateRequest {
  accountIds: number[];
  wbEnvId: string;
  wbMemberId: number;
  wbUsername: string;
  targetCount: number;
}

export interface WbCompanionCreateItem {
  accountId: number;
  taskId: number | null;
  errorCode: string | null;
  errorMessage: string | null;
}

/** 1 进行中 2 成功 3 失败 4 已停止。 */
export type WbCompanionTaskStatus = 1 | 2 | 3 | 4;

export interface WbCompanionTask {
  id: number;
  accountId: number;
  wsPhone: string;
  wbEnvId: string;
  wbUsername: string;
  baseCount: number;
  targetCount: number;
  succeededCount: number;
  status: WbCompanionTaskStatus;
  /** 当前这一条：0 待发起 1 WB 已发起 2 安卓已输入配对码。 */
  step: number;
  wbRole: string | null;
  errorCode: string | null;
  createdAt: number;
  finishedAt: number | null;
  /** 失败后可再次发起的时间（epoch 毫秒）。 */
  retryAfter: number | null;
}

export interface WbCompanionSummary {
  accountId: number;
  wbEnvId: string;
  wbUsername: string;
  connectionCount: number;
  onlineCount: number;
  runningTaskId: number | null;
  runningDone: number;
  runningTarget: number;
}

export interface WbCompanionConnection {
  role: "MAIN" | "SHADOW";
  wbId: number;
  connStatus: "CONNECTED" | "DISCONNECTED" | "LOGGED_OUT";
}

export interface WbCompanionDetail {
  accountId: number;
  wbEnvId: string | null;
  wbEnvName: string | null;
  wbMemberId: number | null;
  wbUsername: string | null;
  wbDeviceId: number | null;
  /** false 表示这次没查到 WB，连接列表不可用。 */
  live: boolean;
  connections: WbCompanionConnection[];
  tasks: WbCompanionTask[];
}

const BASE = "/api/account/wb-companion";

export function listWbTargets(): Promise<WbTarget[]> {
  return armadaRequest<WbTarget[]>("get", `${BASE}/targets`);
}

/** 在目标 WB 按用户名精确查会员。 */
export function findWbMember(
  wbEnvId: string,
  username: string
): Promise<WbMember> {
  return armadaRequest<WbMember>("get", `${BASE}/members`, {
    params: { wbEnvId, username }
  });
}

export function createWbCompanionTasks(
  data: WbCompanionCreateRequest
): Promise<{ items: WbCompanionCreateItem[] }> {
  return armadaRequest<{ items: WbCompanionCreateItem[] }>(
    "post",
    `${BASE}/tasks`,
    { data }
  );
}

export function getWbCompanionTask(taskId: number): Promise<WbCompanionTask> {
  return armadaRequest<WbCompanionTask>("get", `${BASE}/tasks/${taskId}`);
}

export function stopWbCompanionTask(taskId: number): Promise<void> {
  return armadaRequest<void>("post", `${BASE}/tasks/${taskId}/stop`);
}

/** 账号列表"WB 分身"列，读本地快照。 */
export function listWbCompanionSummaries(
  accountIds: number[]
): Promise<WbCompanionSummary[]> {
  return armadaRequest<WbCompanionSummary[]>("post", `${BASE}/summaries`, {
    data: accountIds
  });
}

/** 打开时实时查询 WB 并刷新快照。 */
export function getWbCompanionDetail(
  accountId: number
): Promise<WbCompanionDetail> {
  return armadaRequest<WbCompanionDetail>(
    "get",
    `${BASE}/accounts/${accountId}`
  );
}

export function unbindWbCompanion(accountId: number): Promise<void> {
  return armadaRequest<void>("post", `${BASE}/accounts/${accountId}/unbind`);
}

/** WB、安卓层失败码对应的提示。 */
export function wbCompanionErrorText(code: string | null): string {
  if (!code) return "";
  const known: Record<string, string> = {
    ACCOUNT_OFFLINE: "安卓号不在线，先上线再登录",
    DEVICE_LIMIT_REACHED: "WB 用户的设备名额已满（10 台）",
    SHADOW_DISABLED: "WB 未开启影子连接，只能登录 1 个",
    SHADOW_LIMIT_REACHED: "关联设备已满",
    IMPORT_SOURCE_CONFLICT: "这个号在该用户下是会员自己绑定的设备，不能导入",
    IMPORT_BOUND_ELSEWHERE: "这个号已导入给其他 WB 用户，先解绑",
    IMPORT_IN_PROGRESS: "这个号在 WB 有正在进行的配对",
    IMPORT_DISABLED: "目标 WB 未开启平台导入",
    BRUTAL_DUPLICATE: "这个号正在 WB 别的设备上用狂暴模式",
    PHONE_MISMATCH: "WB 确认的号码与安卓号不一致",
    PAIRING_REJECTED: "WhatsApp 拒绝了配对，可能关联设备已满",
    ANDROID_NO_PENDING: "安卓号没收到配对请求",
    ANDROID_AMBIGUOUS: "同时有多个配对在进行，已停止",
    ANDROID_SEND_FAILED: "配对码发送失败",
    ANDROID_EXPIRED: "配对请求已失效",
    ANDROID_ACCOUNT_OFFLINE: "安卓号不在线",
    ANDROID_UNAVAILABLE: "安卓协议层不可达",
    WB_TIMEOUT: "WB 未上线（超时）",
    WB_PAIRING_EXPIRED: "WB 配对已过期，未确认上线",
    WB_UNAVAILABLE: "WB 不可达",
    WB_ENV_MISMATCH: "WB 环境与配置不一致",
    STOPPED: "已停止"
  };
  return known[code] ?? code;
}
