import { armadaRequest } from "@/api/armada";
import { http } from "@/utils/http";

/** 消息类型：0 链接消息 / 1 图文消息。竞品与本实现都只有这两种，没有按钮。 */
export type ContactMessageType = 0 | 1;

/** 启动方式：立即 / 延后。 */
export type ContactTaskStartMode = "now" | "scheduled";

/** 任务动作，与后端 ContactTaskAction 一一对应。 */
export type ContactTaskAction = "start" | "pause" | "resume" | "stop";

export interface PageResult<T> {
  list: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ContactTaskListItem {
  id: number;
  name: string;
  messageType: ContactMessageType;
  title: string | null;
  promotionLink: string | null;
  /** 归一化后的筛选 JSON 字符串，camelCase */
  accountFilter: string | null;
  isEnabled: number;
  runStatus: number;
  totalSendNum: number | null;
  successMessageNum: number | null;
  usedAccountCount: number | null;
  invalidAccountNum: number | null;
  avgSendPerAccount: number | null;
  taskStartAt: number | null;
  createdAt: number;
}

export interface ContactTaskDetail {
  id: number;
  name: string;
  messageType: ContactMessageType;
  title: string | null;
  description: string | null;
  promotionLink: string | null;
  content: string;
  previewImageFileId: number | null;
  accountFilter: string | null;
  msgIntervalMinSec: number;
  msgIntervalMaxSec: number;
  concurrency: number;
  maxSendsPerAccount: number;
  retryMax: number;
  startMode: ContactTaskStartMode;
  taskDelayMinutes: number;
  taskStartAt: number | null;
  isEnabled: number;
  runStatus: number;
  totalSendNum: number | null;
  successMessageNum: number | null;
  usedAccountCount: number | null;
  invalidAccountNum: number | null;
  avgSendPerAccount: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface ContactTaskAccountItem {
  accountId: number;
  accountPhone: string | null;
  accountStatus: string | null;
  needSendNum: number | null;
  sentNum: number | null;
  failNum: number | null;
}

export interface ContactTaskListQuery {
  page?: number;
  pageSize?: number;
  name?: string;
  runStatus?: number;
  createdAtStart?: number;
  createdAtEnd?: number;
}

export interface ContactTaskAccountDataQuery {
  page?: number;
  pageSize?: number;
  /** 仅接受 needSendNum / sentNum / failNum，其余会被后端忽略 */
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ContactTaskWriteRequest {
  name: string;
  messageType: ContactMessageType;
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
  /** 注意是 JSON **字符串**，不是对象 */
  accountFilterJson: string;
}

export interface MarketingTemplateFileUploadResult {
  id: number;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  url: string;
}

export function listContactTasks(
  query: ContactTaskListQuery = {}
): Promise<PageResult<ContactTaskListItem>> {
  return armadaRequest<PageResult<ContactTaskListItem>>(
    "get",
    "/api/contact-tasks",
    { params: query }
  );
}

export function getContactTask(id: number): Promise<ContactTaskDetail> {
  return armadaRequest<ContactTaskDetail>("get", `/api/contact-tasks/${id}`);
}

export function createContactTask(
  data: ContactTaskWriteRequest
): Promise<ContactTaskDetail> {
  return armadaRequest<ContactTaskDetail>("post", "/api/contact-tasks", {
    data
  });
}

export function updateContactTask(
  id: number,
  data: ContactTaskWriteRequest
): Promise<ContactTaskDetail> {
  return armadaRequest<ContactTaskDetail>("put", `/api/contact-tasks/${id}`, {
    data
  });
}

export function actContactTask(
  id: number,
  action: ContactTaskAction
): Promise<void> {
  return armadaRequest<void>("post", `/api/contact-tasks/${id}/action`, {
    data: { action }
  });
}

export function listContactTaskAccountData(
  id: number,
  query: ContactTaskAccountDataQuery = {}
): Promise<PageResult<ContactTaskAccountItem>> {
  return armadaRequest<PageResult<ContactTaskAccountItem>>(
    "get",
    `/api/contact-tasks/${id}/data`,
    { params: query }
  );
}

/** 预览图/配图内容地址，供 <img> 直接引用。 */
export function contactTaskImageUrl(id: number): string {
  return `/api/marketing-template-files/${id}/content`;
}

/**
 * 上传预览图或配图。
 *
 * 与超链模板共用 `/api/marketing-template-files`；后端已把 `tenant:contact_task:create|edit`
 * 加进该接口的授权列表。必须删掉 Content-Type，让浏览器自己带 multipart boundary。
 */
export function uploadContactTaskImage(
  file: File
): Promise<MarketingTemplateFileUploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  return armadaRequest<MarketingTemplateFileUploadResult>(
    "post",
    "/api/marketing-template-files",
    { data: formData },
    {
      beforeRequestCallback: config => {
        delete config.headers["Content-Type"];
      }
    }
  );
}

export function downloadContactTaskImage(id: number): Promise<Blob> {
  return http.request<Blob>("get", contactTaskImageUrl(id), {
    responseType: "blob"
  });
}
