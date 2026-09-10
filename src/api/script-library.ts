import { armadaRequest } from "@/api/armada";
import type { PageResponse } from "@/api/account";
import type { ScriptMessage, ScriptStep } from "@/api/script-marketing";

export interface ScriptMaterial extends ScriptMessage {
  id: number;
  updatedAt: number;
}
export interface ScriptDefinitionSummary {
  id: number;
  name: string;
  enabled: boolean;
  updatedAt: number;
}
export interface ScriptDefinition extends ScriptDefinitionSummary {
  steps: ScriptStep[];
}
export interface ScriptDefinitionSave {
  name: string;
  enabled: boolean;
  steps: ScriptStep[];
}

/** 公共消息模板可能有历史空字段，在 API 边界归一化成编辑器契约。 */
function material(row: ScriptMaterial): ScriptMaterial {
  return {
    ...row,
    content: row.content ?? "",
    bodyText: row.bodyText ?? "",
    imageFileId: row.imageFileId ?? null,
    promotionLink: row.promotionLink ?? "",
    buttons: row.buttons ?? [],
    mentionAll: row.mentionAll ?? false
  };
}
export const listScriptMaterials = (query: {
  keyword?: string;
  linkMode?: number;
  page: number;
  pageSize: number;
}): Promise<PageResponse<ScriptMaterial>> =>
  armadaRequest<PageResponse<ScriptMaterial>>("get", "/api/script-materials", {
    params: query
  }).then(result => ({ ...result, list: result.list.map(material) }));
export const saveScriptMaterial = (
  message: ScriptMessage,
  id?: number
): Promise<ScriptMaterial> =>
  armadaRequest<ScriptMaterial>(
    id ? "put" : "post",
    id ? `/api/script-materials/${id}` : "/api/script-materials",
    {
      data: {
        ...message,
        buttons: message.linkMode === 2 ? message.buttons : [],
        promotionLink: message.linkMode === 2 ? "" : message.promotionLink
      }
    }
  ).then(material);
export const copyScriptMaterial = (id: number): Promise<ScriptMaterial> =>
  armadaRequest<ScriptMaterial>(
    "post",
    `/api/script-materials/${id}/clone`
  ).then(material);
export const listScriptDefinitions = (query: {
  keyword?: string;
  status?: number;
  page: number;
  pageSize: number;
}): Promise<PageResponse<ScriptDefinitionSummary>> =>
  armadaRequest("get", "/api/script-definitions", { params: query });
export const getScriptDefinition = (id: number): Promise<ScriptDefinition> =>
  armadaRequest("get", `/api/script-definitions/${id}`);
export const saveScriptDefinition = (
  data: ScriptDefinitionSave,
  id?: number
): Promise<ScriptDefinition> =>
  armadaRequest(
    id ? "put" : "post",
    id ? `/api/script-definitions/${id}` : "/api/script-definitions",
    { data }
  );
export const deleteScriptDefinition = (id: number): Promise<void> =>
  armadaRequest("delete", `/api/script-definitions/${id}`);
