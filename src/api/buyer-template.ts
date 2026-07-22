import { armadaRequest } from "@/api/armada";

export interface BuyerTemplateRow {
  id: number;
  code: string;
  name: string;
  previewUrl: string;
  subaccountVisible: boolean;
  supportedParams: string[];
  remark: string;
  createdAt: string;
  updatedAt: string;
}

export interface BuyerTemplateQuery {
  page: number;
  page_size: number;
}

export interface BuyerTemplatePage {
  list: BuyerTemplateRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface BuyerTemplateOption {
  id: number;
  name: string;
}

interface PromotionTemplateSupportedParam {
  code: string;
  label: string;
}

interface PromotionTemplateVO {
  id: number;
  templateCode: string;
  templateName: string;
  previewUri: string;
  subaccountVisible: boolean;
  supportedParams: PromotionTemplateSupportedParam[];
  remark?: string | null;
  createdAt: number;
  updatedAt: number;
}

interface PromotionTemplatePageResult {
  list: PromotionTemplateVO[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "-";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}`;
}

function toBuyerTemplateRow(value: PromotionTemplateVO): BuyerTemplateRow {
  return {
    id: value.id,
    code: value.templateCode,
    name: value.templateName,
    previewUrl: value.previewUri,
    subaccountVisible: value.subaccountVisible,
    supportedParams: value.supportedParams.map(param => param.label),
    remark: value.remark ?? "",
    createdAt: formatTimestamp(value.createdAt),
    updatedAt: formatTimestamp(value.updatedAt)
  };
}

export async function queryBuyerTemplates(
  params: BuyerTemplateQuery
): Promise<BuyerTemplatePage> {
  const result = await armadaRequest<PromotionTemplatePageResult>(
    "get",
    "/api/promotion-templates/query",
    { params: { page: params.page, pageSize: params.page_size } }
  );
  return {
    ...result,
    list: result.list.map(toBuyerTemplateRow)
  };
}

export async function listBuyerTemplateOptions(): Promise<
  BuyerTemplateOption[]
> {
  const pageSize = 200;
  const firstPage = await queryBuyerTemplates({ page: 1, page_size: pageSize });
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(0, firstPage.totalPages - 1) }, (_, index) =>
      queryBuyerTemplates({ page: index + 2, page_size: pageSize })
    )
  );
  const pages = [firstPage, ...remainingPages];
  return pages.flatMap(result =>
    result.list.map(template => ({ id: template.id, name: template.name }))
  );
}

export function updateBuyerTemplateVisibility(
  id: number,
  subaccountVisible: boolean
): Promise<void> {
  return armadaRequest<void>(
    "patch",
    `/api/buyer/templates/${id}/subaccount-visibility`,
    { data: { subaccountVisible } }
  );
}

export function updateBuyerTemplateRemark(
  id: number,
  remark: string
): Promise<void> {
  return armadaRequest<void>("patch", `/api/promotion-templates/${id}/remark`, {
    data: { remark }
  });
}
