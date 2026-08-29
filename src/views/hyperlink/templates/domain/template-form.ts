import type {
  HyperlinkMessageType,
  HyperlinkTemplateDetail,
  HyperlinkTemplateUpdateRequest,
  HyperlinkTemplateWriteRequest,
  SupportedHyperlinkMessageType
} from "@/api/hyperlink-template";

export const HYPERLINK_TEMPLATE_IMAGE_MAX_BYTES = 500 * 1024;

export interface HyperlinkTemplateButtonForm {
  displayText: string;
  targetValue: string;
  useShortLink: boolean;
}

export interface HyperlinkTemplateForm {
  name: string;
  messageType: HyperlinkMessageType;
  title: string;
  content: string;
  linkDescription: string;
  promotionLink: string;
  button: HyperlinkTemplateButtonForm;
  cardText: string;
  assetId: number | null;
  imageName: string;
  imageUrl: string;
  imageFile: File | null;
  remark: string;
  version: number | null;
}

export interface HyperlinkImageValidationResult {
  valid: boolean;
  message: string;
}

export const hyperlinkMessageTypeOptions: Array<{
  label: string;
  value: SupportedHyperlinkMessageType;
}> = [
  { label: "单图文", value: 1 },
  { label: "普通按钮", value: 3 },
  { label: "卡片按钮", value: 4 }
];

export function createEmptyHyperlinkTemplateForm(): HyperlinkTemplateForm {
  return {
    name: "",
    messageType: 1,
    title: "",
    content: "",
    linkDescription: "",
    promotionLink: "",
    button: {
      displayText: "立即查看",
      targetValue: "",
      useShortLink: true
    },
    cardText: "",
    assetId: null,
    imageName: "",
    imageUrl: "",
    imageFile: null,
    remark: "",
    version: null
  };
}

export function toHyperlinkTemplateForm(
  detail: HyperlinkTemplateDetail
): HyperlinkTemplateForm {
  const button = detail.buttons[0];
  const assetId =
    detail.messageType === 1
      ? detail.linkPreviewAssetId
      : detail.messageType === 3 || detail.messageType === 4
        ? detail.bodyMainAssetId
        : (detail.linkPreviewAssetId ?? detail.bodyMainAssetId);
  return {
    name: detail.name,
    messageType: detail.messageType,
    title: detail.title,
    content: detail.content ?? "",
    linkDescription: detail.linkDescription ?? "",
    promotionLink: detail.promotionLink ?? "",
    button: {
      displayText: button?.displayText ?? "立即查看",
      targetValue: button?.targetValue ?? "",
      useShortLink: button?.useShortLink ?? true
    },
    cardText: detail.cardText ?? "",
    assetId,
    imageName: assetId == null ? "" : "已上传图片",
    imageUrl: "",
    imageFile: null,
    remark: detail.remark ?? "",
    version: detail.version
  };
}

export function hyperlinkMessageTypeLabel(type: HyperlinkMessageType): string {
  return (
    hyperlinkMessageTypeOptions.find(option => option.value === type)?.label ??
    "一期暂不支持的消息类型"
  );
}

export function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

function requiredLengthMessage(
  value: string,
  label: string,
  maxLength: number
): string {
  const trimmed = value.trim();
  if (!trimmed) return `请填写${label}`;
  if (trimmed.length > maxLength) return `${label}不能超过 ${maxLength} 个字符`;
  return "";
}

export function validateHyperlinkTemplateForm(
  form: HyperlinkTemplateForm
): string {
  if (form.messageType === 2) return "一期暂不支持双图文";
  if (![1, 3, 4].includes(form.messageType)) return "不支持的消息类型";

  const nameMessage = requiredLengthMessage(form.name, "模板名称", 128);
  if (nameMessage) return nameMessage;
  const titleMessage = requiredLengthMessage(form.title, "标题", 512);
  if (titleMessage) return titleMessage;
  if (form.remark.trim().length > 255) return "备注不能超过 255 个字符";

  if (form.messageType === 1) {
    const contentMessage = requiredLengthMessage(form.content, "正文", 2000);
    if (contentMessage) return contentMessage;
    const descriptionMessage = requiredLengthMessage(
      form.linkDescription,
      "链接描述",
      512
    );
    if (descriptionMessage) return descriptionMessage;
    const promotionLink = form.promotionLink.trim();
    if (!promotionLink) return "请填写推广链接";
    if (promotionLink.length > 2048) return "推广链接不能超过 2048 个字符";
    if (!isAbsoluteHttpUrl(promotionLink))
      return "请输入合法的 http/https 推广链接";
    if (form.assetId == null && form.imageFile == null)
      return "请上传链接预览图";
    return "";
  }

  if (form.content.trim().length > 200) return "正文不能超过 200 个字符";
  const displayTextMessage = requiredLengthMessage(
    form.button.displayText,
    "按钮文字",
    20
  );
  if (displayTextMessage) return displayTextMessage;
  const targetValue = form.button.targetValue.trim();
  if (!targetValue) return "请填写按钮跳转链接";
  if (targetValue.length > 2048) return "按钮跳转链接不能超过 2048 个字符";
  if (!isAbsoluteHttpUrl(targetValue)) {
    return "请输入合法的 http/https 按钮跳转链接";
  }
  if (form.messageType === 4) {
    const cardTextMessage = requiredLengthMessage(
      form.cardText,
      "卡片底部文字",
      500
    );
    if (cardTextMessage) return cardTextMessage;
  }
  return "";
}

export async function validateHyperlinkImageFile(
  file: File
): Promise<HyperlinkImageValidationResult> {
  if (file.size > HYPERLINK_TEMPLATE_IMAGE_MAX_BYTES) {
    return { valid: false, message: "图片不能超过 500KB" };
  }
  if (
    !/\.jpe?g$/i.test(file.name) ||
    file.type.toLowerCase() !== "image/jpeg"
  ) {
    return { valid: false, message: "仅支持 JPG/JPEG 图片" };
  }
  if (file.size < 5) {
    return { valid: false, message: "图片不是有效的 JPEG 文件" };
  }

  const header = new Uint8Array(await file.slice(0, 3).arrayBuffer());
  const tail = new Uint8Array(await file.slice(-2).arrayBuffer());
  const hasJpegMarkers =
    header[0] === 0xff &&
    header[1] === 0xd8 &&
    header[2] === 0xff &&
    tail[0] === 0xff &&
    tail[1] === 0xd9;
  return hasJpegMarkers
    ? { valid: true, message: "" }
    : { valid: false, message: "图片不是有效的 JPEG 文件" };
}

export function toHyperlinkTemplateWriteRequest(
  form: HyperlinkTemplateForm
): HyperlinkTemplateWriteRequest {
  if (form.messageType === 2) throw new Error("一期暂不支持双图文");
  if (
    form.messageType !== 1 &&
    form.messageType !== 3 &&
    form.messageType !== 4
  ) {
    throw new Error("不支持的消息类型");
  }

  const isLinkPreview = form.messageType === 1;
  const isCardButton = form.messageType === 4;
  return {
    name: form.name.trim(),
    schemaVersion: 1,
    messageType: form.messageType,
    title: form.title.trim(),
    content: form.content.trim() || null,
    linkDescription: isLinkPreview ? form.linkDescription.trim() || null : null,
    promotionLink: isLinkPreview ? form.promotionLink.trim() || null : null,
    buttons: isLinkPreview
      ? []
      : [
          {
            type: "CTA_URL",
            displayText: form.button.displayText.trim(),
            targetValue: form.button.targetValue.trim(),
            useShortLink: form.button.useShortLink,
            sort: 1
          }
        ],
    cardText: isCardButton ? form.cardText.trim() || null : null,
    linkPreviewAssetId: isLinkPreview ? form.assetId : null,
    bodyMainAssetId: isLinkPreview ? null : form.assetId,
    remark: form.remark.trim() || null
  };
}

export function toHyperlinkTemplateUpdateRequest(
  form: HyperlinkTemplateForm
): HyperlinkTemplateUpdateRequest {
  if (form.version == null || form.version <= 0) {
    throw new Error("模板版本无效，请刷新后重试");
  }
  return {
    version: form.version,
    ...toHyperlinkTemplateWriteRequest(form)
  };
}
