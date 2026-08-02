import type { BuyerChannelOptions, BuyerChannelRow } from "@/api/buyer-channel";
import type { SystemUserOption } from "@/api/system-user";

type BuyerChannelUserOptions = Pick<
  BuyerChannelOptions,
  "owners" | "creators" | "parentUsers"
>;

export function toBuyerChannelUserOptions(
  users: SystemUserOption[]
): BuyerChannelUserOptions {
  const allUsers = users.map(({ id, name }) => ({ id, name }));
  return {
    owners: users
      .filter(user => user.status === 1)
      .map(({ id, name }) => ({ id, name })),
    creators: allUsers,
    parentUsers: allUsers
  };
}

export function resolveBuyerChannelCreatorNames(
  rows: BuyerChannelRow[],
  creators: BuyerChannelOptions["creators"]
): BuyerChannelRow[] {
  const creatorNames = new Map(
    creators.map(creator => [creator.id, creator.name])
  );
  return rows.map(row => ({
    ...row,
    creatorName: creatorNames.get(row.creatorId) ?? row.creatorName
  }));
}
