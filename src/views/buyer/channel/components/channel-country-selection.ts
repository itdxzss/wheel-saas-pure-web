import { computed } from "vue";
import type { BuyerChannelOptions } from "@/api/buyer-channel";
import type { ChannelFormModel } from "../domain/channel-form";

export function usePreselectedCountrySelection(
  form: ChannelFormModel,
  countries: () => BuyerChannelOptions["countries"]
) {
  return computed({
    get: () => form.preselectedCountry,
    set: value => {
      form.preselectedCountry = value;
      form.defaultDialCode =
        countries().find(country => country.code === value)?.dialCode ?? "";
    }
  });
}
