import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const routesFile = join(root, "mock/asyncRoutes.ts");
const marketingTemplatePage = join(
  root,
  "src/views/material/marketing-template/index.vue"
);
const marketingTemplateDrawer = join(
  root,
  "src/views/material/marketing-template/components/MarketingTemplateDrawer.vue"
);
const marketingTemplatePreview = join(
  root,
  "src/views/material/marketing-template/components/MarketingTemplatePreview.vue"
);
const marketingButtonEditor = join(
  root,
  "src/views/material/marketing-template/components/MarketingButtonEditor.vue"
);
const marketingTemplateComposable = join(
  root,
  "src/views/material/marketing-template/composables/useMarketingTemplatePage.ts"
);
const paginationComponent = join(
  root,
  "src/components/WheelPagination/index.vue"
);

const routes = readFileSync(routesFile, "utf8");
for (const snippet of [
  'path: "/material"',
  'title: "素材管理"',
  'module_key: "material_management"',
  'path: "/task/marketing"',
  'component: "material/marketing-template/index"',
  'name: "TaskMarketingTemplate"',
  'title: "营销模版"',
  "showParent: true",
  'module_key: "marketing_template"',
  'perm_key: "tenant:marketing_template:view"'
]) {
  if (!routes.includes(snippet)) {
    throw new Error(`marketing template route is incomplete: ${snippet}`);
  }
}

if (!existsSync(marketingTemplatePage)) {
  throw new Error(
    "marketing template page is missing: src/views/material/marketing-template/index.vue"
  );
}

if (!existsSync(marketingTemplateDrawer)) {
  throw new Error(
    "marketing template drawer is missing: src/views/material/marketing-template/components/MarketingTemplateDrawer.vue"
  );
}

if (!existsSync(marketingTemplatePreview)) {
  throw new Error(
    "marketing template preview is missing: src/views/material/marketing-template/components/MarketingTemplatePreview.vue"
  );
}

if (!existsSync(marketingButtonEditor)) {
  throw new Error(
    "marketing button editor is missing: src/views/material/marketing-template/components/MarketingButtonEditor.vue"
  );
}

if (!existsSync(marketingTemplateComposable)) {
  throw new Error(
    "marketing template composable is missing: src/views/material/marketing-template/composables/useMarketingTemplatePage.ts"
  );
}

if (!existsSync(paginationComponent)) {
  throw new Error(
    "common pagination component is missing: src/components/WheelPagination/index.vue"
  );
}

const page = readFileSync(marketingTemplatePage, "utf8");
for (const snippet of [
  "营销模版",
  "marketing-template-page",
  "marketing-template-search",
  "PureTableBar",
  "<el-form",
  "精准 ID",
  "输入模板名称关键词",
  "全部类型",
  "普通超链",
  "按钮超链",
  "推广链接",
  "展开搜索条件",
  "收起搜索条件",
  "新增营销模板",
  "复制",
  "预览",
  "批量删除",
  'type="selection"',
  "ID",
  "模板名称",
  "文本类型",
  "引用任务数",
  "操作",
  "编辑",
  '#default="{ dynamicColumns }"',
  'v-if="!dynamicColumns[0].hide"',
  'v-if="!dynamicColumns[5].hide"',
  "WheelPagination"
]) {
  if (!page.includes(snippet)) {
    throw new Error(`marketing template page is incomplete: ${snippet}`);
  }
}

const implementation = [
  page,
  readFileSync(marketingTemplateDrawer, "utf8"),
  readFileSync(marketingTemplatePreview, "utf8"),
  readFileSync(marketingButtonEditor, "utf8"),
  readFileSync(marketingTemplateComposable, "utf8")
].join("\n");
for (const snippet of [
  "<el-drawer",
  "新增营销模版",
  "聊天页收到的营销模版消息实时预览",
  "模版基础信息",
  "内容设置",
  "上传图片",
  "v-model:file-list",
  "URL.createObjectURL",
  "form.imageUrl",
  "营销主图预览会实时同步到左侧",
  "图片超过 500KB 限制",
  "phone-shell",
  "phone-screen",
  "wa-topbar",
  "wa-message-card",
  "Upload image preview",
  "内容",
  "文本",
  "消息按钮",
  "最多 3 个",
  "按钮设置需与 WhatsApp 接收态保持一致",
  "添加按钮",
  "已达到最多 3 个按钮",
  "按钮文字",
  "按钮类型",
  "跳转链接",
  "电话号码",
  "复制内容",
  "快捷回复"
]) {
  if (!implementation.includes(snippet)) {
    throw new Error(
      `marketing template implementation is incomplete: ${snippet}`
    );
  }
}

const pagination = readFileSync(paginationComponent, "utf8");
for (const snippet of ["500", "1000", "<el-pagination"]) {
  if (!pagination.includes(snippet)) {
    throw new Error(`common pagination component is incomplete: ${snippet}`);
  }
}

console.log("marketing template menu verification passed");
