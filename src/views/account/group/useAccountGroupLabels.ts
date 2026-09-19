import { inject, provide, type InjectionKey, type Ref } from "vue";
import type { AccountGroupApiRow } from "@/api/account-group";
import {
  resolveAccountGroupLabel,
  resolveAccountGroupNamesLabel
} from "@/utils/account-group-label";

const accountGroupsKey: InjectionKey<Ref<AccountGroupApiRow[]>> = Symbol(
  "account-group-labels"
);

/** 复用页面已有分组快照，不为表格每一行单独发请求。 */
export function provideAccountGroupLabels(
  groups: Ref<AccountGroupApiRow[]>
): void {
  provide(accountGroupsKey, groups);
}

export function useAccountGroupLabel() {
  const groups = inject(accountGroupsKey);
  return (id?: number | null, name?: string | null): string =>
    resolveAccountGroupLabel(groups?.value ?? [], id, name);
}

export function useAccountGroupNamesLabel() {
  const groups = inject(accountGroupsKey);
  return (names?: string | null): string =>
    resolveAccountGroupNamesLabel(groups?.value ?? [], names);
}
