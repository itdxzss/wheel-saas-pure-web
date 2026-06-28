import { armadaRequest } from "@/api/armada";
import type { PageResponse } from "@/api/account";

export type MarketingTemplateLinkMode = 1 | 2;
export type MarketingTemplateButtonType = "link" | "copy" | "quick";

type BackendButtonType = "LINK_JUMP" | "COPY_CONTENT" | "QUICK_REPLY";

interface BackendMessageButton {
  type: BackendButtonType;
  text: string;
  param?: string | null;
}

export interface BackendMarketingTemplate {
  id: number;
  templateName: string;
  linkMode: MarketingTemplateLinkMode;
  textType?: string | null;
  imageFileId?: number | null;
  content: string;
  bodyText: string;
  buttons?: BackendMessageButton[] | null;
  promotionLink?: string | null;
  remark?: string | null;
  createdAt?: number | null;
  updatedAt?: number | null;
}

interface BackendMarketingTemplateWrite {
  templateName: string;
  linkMode: MarketingTemplateLinkMode;
  textType?: string | null;
  imageFileId?: number | null;
  content: string;
  bodyText: string;
  buttons: BackendMessageButton[];
  promotionLink?: string | null;
  remark?: string | null;
}

export interface MarketingTemplateButton {
  type: MarketingTemplateButtonType;
  label: string;
  value: string;
}

export interface MarketingTemplateRow {
  id: number;
  templateName: string;
  linkMode: MarketingTemplateLinkMode;
  textType?: string | null;
  imageFileId?: number | null;
  content: string;
  bodyText: string;
  buttons: MarketingTemplateButton[];
  promotionLink?: string | null;
  remark?: string | null;
  createdAt?: number | null;
  updatedAt?: number | null;
}

export interface MarketingTemplateQuery {
  page?: number;
  pageSize?: number;
  id?: number;
  keyword?: string;
  textType?: string;
  linkMode?: MarketingTemplateLinkMode | "";
}

export interface MarketingTemplateWrite {
  templateName: string;
  linkMode: MarketingTemplateLinkMode;
  textType?: string | null;
  imageFileId?: number | null;
  content: string;
  bodyText: string;
  buttons: MarketingTemplateButton[];
  promotionLink?: string | null;
  remark?: string | null;
}

function fromBackendButtonType(
  type: BackendButtonType
): MarketingTemplateButtonType {
  if (type === "LINK_JUMP") return "link";
  if (type === "COPY_CONTENT") return "copy";
  return "quick";
}

function toBackendButtonType(
  type: MarketingTemplateButtonType
): BackendButtonType {
  if (type === "link") return "LINK_JUMP";
  if (type === "copy") return "COPY_CONTENT";
  return "QUICK_REPLY";
}

export function normalizeMarketingTemplate(
  row: BackendMarketingTemplate
): MarketingTemplateRow {
  return {
    ...row,
    buttons: (row.buttons ?? []).map(button => ({
      type: fromBackendButtonType(button.type),
      label: button.text,
      value: button.param ?? ""
    }))
  };
}

function toWritePayload(
  data: MarketingTemplateWrite
): BackendMarketingTemplateWrite {
  return {
    templateName: data.templateName,
    linkMode: data.linkMode,
    textType: data.textType || null,
    imageFileId: data.imageFileId ?? null,
    content: data.content,
    bodyText: data.bodyText,
    buttons:
      data.linkMode === 2
        ? data.buttons.map(button => ({
            type: toBackendButtonType(button.type),
            text: button.label,
            param: button.type === "quick" ? null : button.value
          }))
        : [],
    promotionLink: data.promotionLink || null,
    remark: data.remark || null
  };
}

function toListParams(query: MarketingTemplateQuery) {
  return {
    page: query.page,
    pageSize: query.pageSize,
    id: query.id,
    keyword: query.keyword,
    textType: query.textType,
    linkMode: query.linkMode || undefined
  };
}

export function listMarketingTemplates(
  query: MarketingTemplateQuery = {}
): Promise<PageResponse<MarketingTemplateRow>> {
  return armadaRequest<PageResponse<BackendMarketingTemplate>>(
    "get",
    "/api/marketing-templates",
    { params: toListParams(query) }
  ).then(result => ({
    ...result,
    list: result.list?.map(normalizeMarketingTemplate) ?? []
  }));
}

export function updateMarketingTemplate(
  id: number,
  data: MarketingTemplateWrite
): Promise<MarketingTemplateRow> {
  return armadaRequest<BackendMarketingTemplate>(
    "put",
    `/api/marketing-templates/${id}`,
    { data: toWritePayload(data) }
  ).then(normalizeMarketingTemplate);
}

export function toMarketingTemplatePayload(
  data: MarketingTemplateWrite
): BackendMarketingTemplateWrite {
  return toWritePayload(data);
}
