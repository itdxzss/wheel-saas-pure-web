import { armadaRequest } from "@/api/armada";

export type HyperlinkMessageType = 1 | 2 | 3 | 4;
export type SupportedHyperlinkMessageType = Exclude<HyperlinkMessageType, 2>;
export type HyperlinkButtonType = "CTA_URL";

export interface PageResult<T> {
  list: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface HyperlinkButton {
  type: HyperlinkButtonType;
  displayText: string;
  targetValue: string;
  useShortLink: boolean;
  sort: number;
}

export interface HyperlinkMessageContent {
  schemaVersion: 1;
  messageType: HyperlinkMessageType;
  title: string;
  content: string | null;
  linkDescription: string | null;
  promotionLink: string | null;
  buttons: HyperlinkButton[];
  cardText: string | null;
  linkPreviewAssetId: number | null;
  bodyMainAssetId: number | null;
}

export interface HyperlinkTemplateListItem {
  id: number;
  name: string;
  messageType: HyperlinkMessageType;
  title: string;
  linkPreviewAssetId: number | null;
  linkPreviewAssetUrl: string | null;
  bodyMainAssetId: number | null;
  bodyMainAssetUrl: string | null;
  taskRefCount: number;
  version: number;
  createdBy: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface HyperlinkTemplateDetail extends HyperlinkMessageContent {
  id: number;
  name: string;
  remark: string | null;
  linkPreviewAssetUrl: string | null;
  bodyMainAssetUrl: string | null;
  taskRefCount: number;
  version: number;
  createdBy: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface HyperlinkTemplateOption {
  id: number;
  name: string;
  messageType: HyperlinkMessageType;
  title: string;
  version: number;
}

export interface HyperlinkTemplateListQuery {
  page?: number;
  pageSize?: number;
  name?: string;
  messageType?: HyperlinkMessageType;
  createdFrom?: number;
  createdTo?: number;
}

export interface HyperlinkTemplateOptionsQuery {
  messageType?: HyperlinkMessageType;
  keyword?: string;
  limit?: number;
}

export interface HyperlinkTemplateWriteRequest extends HyperlinkMessageContent {
  name: string;
  remark: string | null;
}

export interface HyperlinkTemplateUpdateRequest
  extends HyperlinkTemplateWriteRequest {
  version: number;
}

export function listHyperlinkTemplates(
  query: HyperlinkTemplateListQuery = {}
): Promise<PageResult<HyperlinkTemplateListItem>> {
  return armadaRequest<PageResult<HyperlinkTemplateListItem>>(
    "get",
    "/api/hyperlink-templates",
    { params: query }
  );
}

export function getHyperlinkTemplate(
  id: number
): Promise<HyperlinkTemplateDetail> {
  return armadaRequest<HyperlinkTemplateDetail>(
    "get",
    `/api/hyperlink-templates/${id}`
  );
}

export function listHyperlinkTemplateOptions(
  query: HyperlinkTemplateOptionsQuery = {}
): Promise<HyperlinkTemplateOption[]> {
  return armadaRequest<HyperlinkTemplateOption[]>(
    "get",
    "/api/hyperlink-templates/options",
    { params: query }
  );
}

export function createHyperlinkTemplate(
  data: HyperlinkTemplateWriteRequest
): Promise<HyperlinkTemplateDetail> {
  return armadaRequest<HyperlinkTemplateDetail>(
    "post",
    "/api/hyperlink-templates",
    { data }
  );
}

export function updateHyperlinkTemplate(
  id: number,
  data: HyperlinkTemplateUpdateRequest
): Promise<HyperlinkTemplateDetail> {
  return armadaRequest<HyperlinkTemplateDetail>(
    "put",
    `/api/hyperlink-templates/${id}`,
    { data }
  );
}

export function copyHyperlinkTemplate(
  id: number
): Promise<HyperlinkTemplateDetail> {
  return armadaRequest<HyperlinkTemplateDetail>(
    "post",
    `/api/hyperlink-templates/${id}/copy`
  );
}

export function deleteHyperlinkTemplate(id: number): Promise<void> {
  return armadaRequest<void>("delete", `/api/hyperlink-templates/${id}`);
}
