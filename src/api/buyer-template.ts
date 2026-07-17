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
  runtimeVersion: string;
}

export function listBuyerTemplates(): Promise<BuyerTemplateRow[]> {
  return armadaRequest<BuyerTemplateRow[]>("get", "/api/buyer/templates");
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
  return armadaRequest<void>("patch", `/api/buyer/templates/${id}/remark`, {
    data: { remark }
  });
}
