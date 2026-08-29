/**
 * 通讯录任务表单：默认值、校验、提交体组装。
 *
 * 与后端 `ContactTaskFormValidator` 是同一套口径，前端先拦一遍只是为了少一次往返，
 * **后端仍然会独立校验**，不要把这里当成唯一防线。
 */

import { normalizeInterval } from "./interval-preset";
import { type AccountFilterForm, toAccountFilterJson } from "./account-filter";

/** 链接消息：标题 / 链接描述 / 推广链接 / 正文。 */
export const MESSAGE_TYPE_LINK = 0;

/** 图文消息：只有文案，配图可选。 */
export const MESSAGE_TYPE_IMAGE = 1;

export type ContactTaskStartMode = "now" | "scheduled";

export interface ContactTaskForm {
  name: string;
  messageType: number;
  /** 仅链接消息使用 */
  title: string;
  /** 表单叫 linkDescription，后端字段叫 description */
  linkDescription: string;
  promotionLink: string;
  content: string;
  previewImageFileId: number | null;
  msgIntervalMinSec: number;
  msgIntervalMaxSec: number;
  concurrency: number;
  maxSendsPerAccount: number;
  retryMax: number;
  startMode: ContactTaskStartMode;
  taskDelayMinutes: number;
  isEnabled: number;
}

export interface ContactTaskWriteRequest {
  name: string;
  messageType: number;
  title: string;
  description: string;
  promotionLink: string;
  content: string;
  previewImageFileId: number | null;
  msgIntervalMinSec: number;
  msgIntervalMaxSec: number;
  concurrency: number;
  maxSendsPerAccount: number;
  retryMax: number;
  startMode: ContactTaskStartMode;
  taskDelayMinutes: number;
  isEnabled: number;
  accountFilterJson: string;
}

/** 默认值与竞品逐字一致。 */
export function defaultTaskForm(): ContactTaskForm {
  return {
    name: "",
    messageType: MESSAGE_TYPE_IMAGE,
    title: "",
    linkDescription: "",
    promotionLink: "",
    content: "",
    previewImageFileId: null,
    msgIntervalMinSec: 0.5,
    msgIntervalMaxSec: 1,
    concurrency: 10,
    maxSendsPerAccount: 50,
    retryMax: 3,
    startMode: "now",
    taskDelayMinutes: 0,
    isEnabled: 1
  };
}

export interface TaskFormContext {
  /** 账号范围实时试算命中数；未试算时传 undefined */
  matchedAccountCount?: number;
}

/**
 * 校验表单，返回全部错误文案。
 *
 * @param form 表单值
 * @param context 额外上下文，目前只有账号范围试算结果
 * @returns 错误文案列表，空数组表示通过
 */
export function validateTaskForm(
  form: ContactTaskForm,
  context: TaskFormContext = {}
): string[] {
  const errors: string[] = [];
  if (!form.name.trim()) {
    errors.push("任务名称不能为空");
  }
  if (form.name.trim().length > 128) {
    errors.push("任务名称最长 128 字");
  }
  if (!form.content.trim()) {
    errors.push("正文内容不能为空");
  }
  if (form.messageType === MESSAGE_TYPE_LINK) {
    if (!form.title.trim()) {
      errors.push("消息标题不能为空");
    }
    if (!form.linkDescription.trim()) {
      errors.push("链接描述不能为空");
    }
    if (!form.promotionLink.trim()) {
      errors.push("推广链接不能为空");
    }
  }
  if (form.concurrency < 1 || form.concurrency > 200) {
    errors.push("最大执行账号数需在 1~200 之间");
  }
  if (form.retryMax < 0 || form.retryMax > 10) {
    errors.push("失败重试次数需在 0~10 之间");
  }
  if (form.maxSendsPerAccount < 0) {
    errors.push("每号最大发送数不能为负");
  }
  // 「延后 + 延迟 0」只在启用时拒绝；仅保存草稿是允许的
  if (
    form.isEnabled === 1 &&
    form.startMode === "scheduled" &&
    form.taskDelayMinutes <= 0
  ) {
    errors.push("延迟时间需大于 0 分钟");
  }
  if (form.isEnabled === 1 && context.matchedAccountCount === 0) {
    errors.push("账号范围未命中任何账号，无法启用");
  }
  return errors;
}

/**
 * 组装提交体。
 *
 * 图文消息时三个链接字段恒为空串；立即执行时延迟恒为 0；
 * 账号筛选提交的是 **JSON 字符串**而不是对象。
 *
 * @param form 表单值
 * @param filter 账号筛选表单值
 * @returns 可直接 POST/PUT 的请求体
 */
export function toWriteRequest(
  form: ContactTaskForm,
  filter: AccountFilterForm
): ContactTaskWriteRequest {
  const isLink = form.messageType === MESSAGE_TYPE_LINK;
  const interval = normalizeInterval(
    form.msgIntervalMinSec,
    form.msgIntervalMaxSec
  );
  return {
    name: form.name.trim(),
    messageType: form.messageType,
    title: isLink ? form.title.trim() : "",
    description: isLink ? form.linkDescription.trim() : "",
    promotionLink: isLink ? form.promotionLink.trim() : "",
    content: form.content.trim(),
    previewImageFileId: form.previewImageFileId,
    msgIntervalMinSec: interval.min,
    msgIntervalMaxSec: interval.max,
    concurrency: form.concurrency,
    maxSendsPerAccount: form.maxSendsPerAccount,
    retryMax: form.retryMax,
    startMode: form.startMode,
    taskDelayMinutes: form.startMode === "now" ? 0 : form.taskDelayMinutes,
    isEnabled: form.isEnabled,
    accountFilterJson: toAccountFilterJson(filter)
  };
}
