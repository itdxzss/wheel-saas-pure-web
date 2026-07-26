import type { ChannelPlatform } from "@/api/buyer-channel";

export const previewPlatformOptions: Array<{
  label: string;
  value: ChannelPlatform;
}> = [
  { label: "Facebook", value: "FACEBOOK" },
  { label: "TikTok", value: "TIKTOK" },
  { label: "快手", value: "KUAISHOU" },
  { label: "MGSKY Ads", value: "MGSKY" }
];

export interface PlatformFieldConfig {
  pixelLabel: string;
  pixelPlaceholder: string;
  accessTokenLabel?: string;
  accessTokenPlaceholder?: string;
  browserName: string;
  showEvents: boolean;
}

export const platformFieldConfigs: Record<
  ChannelPlatform,
  PlatformFieldConfig
> = {
  FACEBOOK: {
    pixelLabel: "FB Pixel ID",
    pixelPlaceholder: "请输入 Facebook 像素 ID",
    accessTokenLabel: "FB Access Token",
    accessTokenPlaceholder: "请输入 FB Conversions API 长效 Access Token",
    browserName: "Facebook",
    showEvents: true
  },
  TIKTOK: {
    pixelLabel: "TikTok Pixel ID",
    pixelPlaceholder: "请输入 TikTok 像素 ID",
    accessTokenLabel: "TikTok Access Token",
    accessTokenPlaceholder: "请输入 TikTok Events API 长效 Access Token",
    browserName: "TikTok",
    showEvents: false
  },
  KUAISHOU: {
    pixelLabel: "快手 Pixel ID",
    pixelPlaceholder: "请输入 快手 像素 ID",
    browserName: "快手",
    showEvents: false
  },
  MGSKY: {
    pixelLabel: "MGSKY Ads Pixel ID",
    pixelPlaceholder: "请输入 MGSKY Ads 像素 ID",
    browserName: "MGSKY Ads",
    showEvents: false
  }
};
