import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const remainingRoutes = readFileSync(
  new URL("./modules/remaining.ts", import.meta.url),
  "utf8"
);
const router = readFileSync(new URL("./index.ts", import.meta.url), "utf8");
const preview = readFileSync(
  new URL("../views/buyer/date-v2-preview/index.vue", import.meta.url),
  "utf8"
);
const viteConfig = readFileSync(
  new URL("../../vite.config.ts", import.meta.url),
  "utf8"
);
const publicHtml = readFileSync(
  new URL("../../date-v2.html", import.meta.url),
  "utf8"
);
const publicEntry = readFileSync(
  new URL("../date-v2-main.ts", import.meta.url),
  "utf8"
);

describe("date v2 development preview route", () => {
  it("registers a full-screen development-only route without adding a menu", () => {
    assert.ok(remainingRoutes.includes('path: "/date-v2-preview"'));
    assert.ok(remainingRoutes.includes('name: "DateV2Preview"'));
    assert.ok(remainingRoutes.includes("import.meta.env.DEV"));
    assert.ok(remainingRoutes.includes("showLink: false"));
    assert.ok(router.includes('"/date-v2-preview"'));
    assert.ok(preview.includes("DateV2Landing"));
    assert.ok(preview.includes("DateV2LoginDialog"));
    assert.ok(preview.includes("DateV2Chat"));
    assert.ok(preview.includes("themeColor"));
  });

  it("builds a router-independent public entry for direct promotion paths", () => {
    assert.ok(viteConfig.includes('dateV2: pathResolve("./date-v2.html"'));
    assert.ok(publicHtml.includes('src="/src/date-v2-main.ts"'));
    assert.ok(publicEntry.includes("resolveDateV2PathPromotionCode"));
    assert.ok(publicEntry.includes("window.location.pathname"));
    assert.ok(!publicEntry.includes("vue-router"));
    assert.ok(!preview.includes("useRoute"));
  });
});
