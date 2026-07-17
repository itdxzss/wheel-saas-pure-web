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
  editing: boolean
): BuyerChannelPayload {
  if (!form.templateId) throw new Error("请选择绑定模板");
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
  create: (payload: BuyerChannelPayload) => Promise<unknown>;
  update: (id: number, payload: BuyerChannelPayload) => Promise<unknown>;
}

function isConflict(error: unknown): boolean {
  return hasApiErrorCode(error, "DOMAIN_TEMPLATE_CONFLICT");
}

export async function saveChannelForm(
  form: ChannelFormModel,
  editing: boolean,
  services: ChannelSaveServices
): Promise<void> {
  const payload = buildChannelPayload(form, editing);
  const binding = await services.precheck({
    domain: payload.domain,
    templateId: payload.templateId,
    excludeChannelId: editing ? form.id : undefined
  });
  if (!binding.available && binding.templateId !== payload.templateId) {
    throw new Error(DOMAIN_TEMPLATE_CONFLICT_MESSAGE);
  }
  try {
    if (editing) {
      if (!form.id) throw new Error("缺少渠道 ID");
      await services.update(form.id, payload);
    } else {
      await services.create(payload);
    }
  } catch (error) {
    if (isConflict(error)) throw new Error(DOMAIN_TEMPLATE_CONFLICT_MESSAGE);
    throw error;
  }
}
