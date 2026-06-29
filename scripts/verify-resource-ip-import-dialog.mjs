import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function read(path) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) {
    throw new Error(`missing file: ${path}`);
  }
  return readFileSync(fullPath, "utf8");
}

function expectIncludes(content, snippets, label) {
  const normalizedContent = content.replace(/\s+/g, " ");
  for (const snippet of snippets) {
    const normalizedSnippet = snippet.replace(/\s+/g, " ");
    if (
      !content.includes(snippet) &&
      !normalizedContent.includes(normalizedSnippet)
    ) {
      throw new Error(`${label} is incomplete: ${snippet}`);
    }
  }
}

const page = read("src/views/resource/ip/index.vue");
expectIncludes(
  page,
  ["IpImportDialog", "openImportDialog", "showImportDialog"],
  "resource IP page"
);

if (page.includes("<el-drawer")) {
  throw new Error("resource IP import must use dialog, not drawer");
}

const dialog = read("src/views/resource/ip/components/IpImportDialog.vue");
expectIncludes(
  dialog,
  [
    "<el-dialog",
    "<el-form",
    "<el-select",
    "<el-radio-group",
    "<el-upload",
    "文件格式要求",
    "代理地址:端口:用户名:密码",
    "proxy.example.com:443:oper:mysecretpass1",
    "proxy.example.com:443:oper:mysecretpass2",
    "英文冒号",
    "不符合规范的行将作为格式错误不予导入",
    "所选国家 / 来源 / 类型将作用于文件中全部记录"
  ],
  "resource IP import dialog"
);

if (dialog.includes("<el-drawer") || dialog.includes("<dialog")) {
  throw new Error("resource IP import dialog must use Element Plus dialog");
}

console.log("resource IP import dialog verification passed");
