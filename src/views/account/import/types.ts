export type AccountImportKind = "six" | "json" | "fullparam";
export type AccountImportDetailStatus = "" | "SUCCESS" | "FAIL" | "ABNORMAL";
export type AccountImportExportKind = "ALL" | "SUCCESS" | "FAIL";

export interface AccountImportSearchForm {
  keyword: string;
  importType: string;
  group: string;
  device: string;
  accountType: string;
  login: string;
  status: string;
}

export interface AccountImportSubmitPayload {
  importKind: AccountImportKind;
  filename?: string | null;
  groupId: number;
  device: string;
  accountType: string;
  ipMode: string;
  remark?: string | null;
  text?: string | null;
  file?: File | null;
}
