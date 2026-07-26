import { computed, type ComputedRef } from "vue";
import type { ChannelFormModel } from "../domain/channel-form";
import type { PlatformFieldConfig } from "./channel-platform-fields";

type ValidationCallback = (error?: string | Error) => void;

export function useChannelTrackingFields(
  form: ChannelFormModel,
  editing: ComputedRef<boolean>,
  platformFieldConfig: ComputedRef<PlatformFieldConfig>
) {
  const supportsToken = computed(
    () => platformFieldConfig.value.accessTokenLabel !== undefined
  );
  const requiresAccessToken = computed(
    () =>
      supportsToken.value &&
      form.pixelId.trim().length > 0 &&
      !(editing.value && form.accessTokenConfigured)
  );
  const requiresPixelId = computed(
    () => supportsToken.value && form.accessToken.trim().length > 0
  );
  const appOpenMessage = computed(
    () =>
      `用户点击广告后，可直接在 ${platformFieldConfig.value.browserName} 内置浏览器里完成登录上号，无需跳出 App。`
  );

  function validatePixelId(
    _rule: unknown,
    value: unknown,
    callback: ValidationCallback
  ): void {
    if (!requiresPixelId.value || String(value ?? "").trim()) {
      callback();
      return;
    }
    callback(new Error(`请输入${platformFieldConfig.value.pixelLabel}`));
  }

  function validateAccessToken(
    _rule: unknown,
    value: unknown,
    callback: ValidationCallback
  ): void {
    if (!requiresAccessToken.value || String(value ?? "").trim()) {
      callback();
      return;
    }
    callback(
      new Error(
        `请输入${platformFieldConfig.value.accessTokenLabel ?? "Access Token"}`
      )
    );
  }

  return {
    supportsToken,
    requiresAccessToken,
    requiresPixelId,
    appOpenMessage,
    validatePixelId,
    validateAccessToken
  };
}
