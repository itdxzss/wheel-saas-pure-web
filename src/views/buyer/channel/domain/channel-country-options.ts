import type { BuyerChannelOptions } from "@/api/buyer-channel";
import type { IpCountryOption } from "@/api/resource-ip";

export function toBuyerChannelCountries(
  rows: readonly IpCountryOption[]
): BuyerChannelOptions["countries"] {
  return rows
    .filter(country => !country.virtual && Boolean(country.iso2))
    .map(country => ({
      code: country.iso2 as string,
      name: country.nameZh,
      dialCode: country.phonePrefix,
      flag: country.flag
    }));
}
