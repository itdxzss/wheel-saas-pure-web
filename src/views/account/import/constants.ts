import type {
  AccountImportDetailStatus,
  AccountImportExportKind,
  AccountImportKind
} from "./types";

export const AUTO_IP_MODE = "系统自动分配（根据账号国家分配）";

export const importKindLabelMap: Record<AccountImportKind, string> = {
  six: "六段号",
  json: "JSON号",
  fullparam: "全参账号"
};

export const importTypeOptions = [
  { label: "六段号", value: "六段号" },
  { label: "JSON号", value: "JSON号" },
  { label: "全参账号", value: "全参账号" }
];

export const importKindOptions: Array<{
  label: string;
  value: AccountImportKind;
  desc: string;
  accept: string;
  disabled?: boolean;
}> = [
  {
    label: "六段号",
    value: "six",
    desc: "支持粘贴或上传 TXT，一行一个六段号。",
    accept: ".txt",
    disabled: true
  },
  {
    label: "JSON号",
    value: "json",
    desc: "上传 ZIP 包，后端解压每个 Baileys JSON 账号文件。",
    accept: ".zip"
  },
  {
    label: "全参账号",
    value: "fullparam",
    desc: "支持粘贴或上传 TXT，保留完整参数。",
    accept: ".txt"
  }
];

export const deviceOptions = ["安卓", "苹果"];
export const accountTypeOptions = ["个人", "商业"];

export const loginOptions = [
  { label: "有失败", value: "有失败" },
  { label: "无失败", value: "无失败" }
];

export const statusOptions = ["导入中", "已完成"];

export const detailStatusOptions: Array<{
  label: string;
  value: AccountImportDetailStatus;
}> = [
  { label: "全部", value: "" },
  { label: "成功", value: "SUCCESS" },
  { label: "失败", value: "FAIL" },
  { label: "异常", value: "ABNORMAL" }
];

export const exportOptions: Array<{
  label: string;
  value: AccountImportExportKind;
}> = [
  { label: "导出全部", value: "ALL" },
  { label: "导出成功", value: "SUCCESS" },
  { label: "导出失败", value: "FAIL" }
];

export const accountImportColumns: TableColumnList = [
  { label: "ID", prop: "id", width: 90 },
  { label: "来源文件", prop: "filename", minWidth: 180 },
  { label: "导入类型", prop: "import_type", width: 120 },
  { label: "分组", prop: "group", minWidth: 140 },
  { label: "机型", prop: "device", width: 100 },
  { label: "账号类型", prop: "account_type", width: 110 },
  { label: "任务进度", prop: "progress", width: 120 },
  { label: "登录成功 / 失败", prop: "login_result", width: 150 },
  { label: "登录异常", prop: "abnormal", width: 160 },
  { label: "创建时间", prop: "created_at", width: 180 },
  { label: "状态", prop: "status", width: 110 },
  { label: "操作", prop: "operation", fixed: "right", width: 170 }
];
