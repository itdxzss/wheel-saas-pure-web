import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { createInitRouter } from "./init-router";

const guardSource = readFileSync(
  new URL("./index.ts", import.meta.url),
  "utf8"
);

describe("dynamic router initialization", () => {
  it("rejects with the real menu request failure without applying routes", async () => {
    const menuFailure = new Error("menu unavailable");
    let applied = false;
    const initRouter = createInitRouter<string, { ready: true }>({
      cacheKey: () => null,
      readCache: () => null,
      loadRoutes: async () => {
        throw menuFailure;
      },
      applyRoutes: () => {
        applied = true;
      },
      writeCache: () => undefined,
      router: () => ({ ready: true })
    });

    await assert.rejects(initRouter, error => error === menuFailure);
    assert.equal(applied, false);
  });

  it("rejects when real route assembly fails", async () => {
    const assemblyFailure = new Error("route assembly failed");
    const initRouter = createInitRouter<string, { ready: true }>({
      cacheKey: () => null,
      readCache: () => null,
      loadRoutes: async () => ["/welcome"],
      applyRoutes: () => {
        throw assemblyFailure;
      },
      writeCache: () => undefined,
      router: () => ({ ready: true })
    });

    await assert.rejects(initRouter, error => error === assemblyFailure);
  });

  it("ends refresh loading on menu failure and shows the static server error", () => {
    assert.match(guardSource, /!remainingPaths\.includes\(to\.path\)/);
    assert.match(
      guardSource,
      /initRouter\(\)[\s\S]*?\.catch\([\s\S]*?NProgress\.done\(\)[\s\S]*?router\.replace\("\/server-error"\)/
    );
  });
});
