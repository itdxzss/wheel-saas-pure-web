import type {
  BuyerChannelDetail,
  BuyerChannelPayload,
  ChannelPlatform,
  ChannelStatus,
  CountryMode,
  DomainBindingResult
} from "../../../../api/buyer-channel";
import {
  DOMAIN_TEMPLATE_CONFLICT_MESSAGE,
  normalizeChannelDomain
} from "@/views/buyer/channel/domain/channel-domain";
import { hasApiErrorCode } from "@/utils/api-error";

export interface ChannelFormModel {
  id?: number;
  name: string;
  ownerId?: number;
  targetCountry: string;
  countryMode: CountryMode;
  templateId?: number;
  themeColor: string;
  domain: string;
  defaultDialCode: string;
  platform: ChannelPlatform;
  pixelId: string;
  accessToken: string;
  accessTokenConfigured: boolean;
  eventLead: string;
  eventInitiateCheckout: string;
  eventCompleteRegistration: string;
  openInApp: boolean;
  joinMarketing: boolean;
  status: ChannelStatus;
}

export function createDefaultChannelForm(): ChannelFormModel {
  return {
    name: "",
    ownerId: undefined,
    targetCountry: "",
    countryMode: "SPECIFIC",
    templateId: undefined,
    themeColor: "#409EFF",
    domain: "",
    defaultDialCode: "",
    platform: "FACEBOOK",
    pixelId: "",
    accessToken: "",
    accessTokenConfigured: false,
    eventLead: "Lead",
    eventInitiateCheckout: "InitiateCheckout",
    eventCompleteRegistration: "CompleteRegistration",
    openInApp: false,
    joinMarketing: true,
    status: "ENABLED"
  };
}

export function hydrateChannelForm(
  detail: BuyerChannelDetail
): ChannelFormModel {
  return {
    ...createDefaultChannelForm(),
    ...detail,
    countryMode: detail.countryMode ?? "SPECIFIC",
    themeColor: detail.themeColor ?? "#409EFF",
    pixelId: detail.pixelId ?? "",
    accessToken: "",
    eventLead: detail.eventLead ?? "Lead",
    eventInitiateCheckout: detail.eventInitiateCheckout ?? "InitiateCheckout",
    eventCompleteRegistration:
      detail.eventCompleteRegistration ?? "CompleteRegistration",
    openInApp: detail.openInApp ?? false,
    joinMarketing: detail.joinMarketing ?? true
  };
}

export function buildChannelPayload(
  form: ChannelFormModel,
  editing: boolean,
  countries: Array<{ code: string; dialCode: string }> = []
): BuyerChannelPayload {
  if (!form.templateId) throw new Error("请选择绑定模板");
  const country = countries.find(item => item.code === form.targetCountry);
  if (
    form.countryMode === "SPECIFIC" &&
    country &&
    country.dialCode !== form.defaultDialCode
  ) {
    throw new Error("默认区号必须与目标国家一致");
  }
  const payload: BuyerChannelPayload = {
    name: form.name.trim(),
    ownerId: form.ownerId,
    targetCountry: form.targetCountry,
    countryMode: form.countryMode,
    templateId: form.templateId,
    themeColor: form.themeColor,
    domain: normalizeChannelDomain(form.domain),
    defaultDialCode: form.defaultDialCode,
    platform: form.platform,
    pixelId: form.pixelId.trim() || undefined,
    eventLead: form.eventLead.trim(),
    eventInitiateCheckout: form.eventInitiateCheckout.trim(),
    eventCompleteRegistration: form.eventCompleteRegistration.trim(),
    openInApp: form.openInApp,
    joinMarketing: form.joinMarketing,
    status: form.status
  };
  const supportsToken =
    form.platform === "FACEBOOK" || form.platform === "TIKTOK";
  if (
    supportsToken &&
    form.accessToken.trim() &&
    (!editing || form.accessToken.trim())
  ) {
    payload.accessToken = form.accessToken.trim();
  }
  return payload;
}

export interface ChannelSaveServices {
  precheck: (params: {
    domain: string;
    templateId: number;
    excludeChannelId?: number;
  }) => Promise<DomainBindingResult>;
  create: (payload: BuyerChannelPayload) => Promise<{ published: boolean }>;
  update: (
    id: number,
    payload: BuyerChannelPayload
  ) => Promise<{ published: boolean }>;
}

function isConflict(error: unknown): boolean {
  return hasApiErrorCode(error, "DOMAIN_TEMPLATE_CONFLICT");
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;
}

function fieldMessage(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) return fieldMessage(value[0]);
  return fieldMessage(asRecord(value)?.message);
}

export function channelFormFieldErrors(
  error: unknown
): Partial<Record<keyof ChannelFormModel, string>> {
  if (
    isConflict(error) ||
    (error instanceof Error &&
      error.message === DOMAIN_TEMPLATE_CONFLICT_MESSAGE)
  ) {
    return { domain: DOMAIN_TEMPLATE_CONFLICT_MESSAGE };
  }
  const root = asRecord(error);
  const response = asRecord(root?.response);
  const status = response?.status ?? root?.code;
  if (Number(status) !== 422) return {};
  const data = asRecord(response ? response.data : root?.data);
  const source = data?.fieldErrors ?? data?.errors ?? data?.fields;
  const allowed = new Set<keyof ChannelFormModel>([
    "name",
    "ownerId",
    "targetCountry",
    "templateId",
    "themeColor",
    "domain",
    "defaultDialCode",
    "platform",
    "pixelId",
    "accessToken",
    "eventLead",
    "eventInitiateCheckout",
    "eventCompleteRegistration",
    "openInApp",
    "joinMarketing",
    "status"
  ]);
  const result: Partial<Record<keyof ChannelFormModel, string>> = {};
  if (Array.isArray(source)) {
    source.forEach(item => {
      const record = asRecord(item);
      const field = record?.field;
      const message = fieldMessage(record?.message);
      if (
        typeof field === "string" &&
        allowed.has(field as keyof ChannelFormModel) &&
        message
      ) {
        result[field as keyof ChannelFormModel] = message;
      }
    });
    return result;
  }
  const record = asRecord(source);
  if (!record) return result;
  Object.entries(record).forEach(([field, value]) => {
    const message = fieldMessage(value);
    if (allowed.has(field as keyof ChannelFormModel) && message) {
      result[field as keyof ChannelFormModel] = message;
    }
  });
  return result;
}

export async function saveChannelForm(
  form: ChannelFormModel,
  editing: boolean,
  services: ChannelSaveServices,
  countries: Array<{ code: string; dialCode: string }> = []
): Promise<void> {
  const payload = buildChannelPayload(form, editing, countries);
  const binding = await services.precheck({
    domain: payload.domain,
    templateId: payload.templateId,
    excludeChannelId: editing ? form.id : undefined
  });
  if (!binding.available && binding.templateId !== payload.templateId) {
    throw new Error(DOMAIN_TEMPLATE_CONFLICT_MESSAGE);
  }
  try {
    let result: { published: boolean };
    if (editing) {
      if (!form.id) throw new Error("缺少渠道 ID");
      result = await services.update(form.id, payload);
    } else {
      result = await services.create(payload);
    }
    if (result.published !== true) throw new Error("渠道发布失败，请重试");
  } catch (error) {
    if (isConflict(error)) throw new Error(DOMAIN_TEMPLATE_CONFLICT_MESSAGE);
    throw error;
  }
}
