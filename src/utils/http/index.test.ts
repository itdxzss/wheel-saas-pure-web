import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./index.ts", import.meta.url), "utf8");

test("request callback falls through to bearer token injection", () => {
  assert.match(
    source,
    /if \(typeof config\.beforeRequestCallback === "function"\) \{\s*config\.beforeRequestCallback\(config\);\s*\} else if \(PureHttp\.initConfig\.beforeRequestCallback\) \{\s*PureHttp\.initConfig\.beforeRequestCallback\(config\);\s*\}/
  );

  const callbackIndex = source.indexOf(
    'if (typeof config.beforeRequestCallback === "function")'
  );
  const authorizationIndex = source.indexOf(
    'config.headers["Authorization"] = formatToken(data.accessToken)'
  );
  assert.ok(callbackIndex >= 0);
  assert.ok(authorizationIndex > callbackIndex);
});
