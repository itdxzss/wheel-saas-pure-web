import { armadaRequest } from "@/api/armada";

/** 后端单次最多查询的账号数；超出时由调用方分批。 */
export const MESSAGE_CAP_MAX_ACCOUNTS = 100;

/** 单个账号本次查询的处理结果，与后端 AccountMessageCapQueryStatus 一一对应。 */
export type MessageCapQueryStatus =
  | "SUCCESS"
  | "REJECTED"
  | "OFFLINE"
  | "UNSUPPORTED_BACKEND"
  | "ACCOUNT_UNAVAILABLE"
  | "FAILED";

/**
 * 新聊天额度快照。数值与时间戳均为十进制字符串（时间戳为秒），null 表示平台未提供，
 * 不能当作 0 或无限；平台特殊值 "-1" 原样保留，此时 remaining 为 null。
 */
export interface MessageCap {
  /** OK / PARTIAL / NO_DATA / UNSUPPORTED_FORMAT / NON_NUMERIC_QUOTA / REJECTED。 */
  resultStatus: string;
  totalQuota: string | null;
  usedQuota: string | null;
  remaining: string | null;
  cappingStatus: string | null;
  cycleStart: string | null;
  cycleEnd: string | null;
  serverSentTimestamp: string | null;
  mvStatus: string | null;
  oteStatus: string | null;
  subscriptionStatus: string | null;
  subscriptionName: string | null;
  extensions: unknown;
  fetchedAt: string | null;
  /** 仅 REJECTED：协议层结构化诊断。 */
  failure: unknown;
  /** 请求 debug 时的原始响应十六进制与完整解码内容。 */
  debug: unknown;
}

export interface MessageCapItem {
  accountId: number;
  phone: string | null;
  backend: string | null;
  queryStatus: MessageCapQueryStatus;
  /** 仅 FAILED：协议异常类型，如 TIMEOUT、NETWORK。 */
  errorCode: string | null;
  cap: MessageCap | null;
}

export interface MessageCapBatch {
  requested: number;
  succeeded: number;
  failed: number;
  items: MessageCapItem[];
}

/** 批量查询选中账号的新聊天额度（会真实触达 WhatsApp，每个账号只查一次）。 */
export const queryAccountMessageCap = (ids: number[], debug: boolean) =>
  armadaRequest<MessageCapBatch>("post", "/api/accounts/message-cap/query", {
    data: { ids, debug }
  });
