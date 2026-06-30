import { createRequire } from "node:module";
import { register } from "node:module";
import { resolve } from "node:path";

register(new URL("./node-test-loader.mjs", import.meta.url));

const require = createRequire(import.meta.url);
const originalResolveFilename = require("node:module")._resolveFilename;
const projectRoot = resolve(import.meta.dirname, "../../..");
const armadaDouble = resolve(
  import.meta.dirname,
  "armada-test-double.ts"
);
const httpDouble = resolve(
  import.meta.dirname,
  "http-test-double.ts"
);
const timeDouble = resolve(
  import.meta.dirname,
  "time-test-double.ts"
);

require("node:module")._resolveFilename = function resolveTestAlias(
  request,
  parent,
  isMain,
  options
) {
  if (request === "@/api/armada") {
    return originalResolveFilename.call(
      this,
      armadaDouble,
      parent,
      isMain,
      options
    );
  }
  if (request === "@/utils/http") {
    return originalResolveFilename.call(
      this,
      httpDouble,
      parent,
      isMain,
      options
    );
  }
  if (request === "@/utils/time") {
    return originalResolveFilename.call(
      this,
      timeDouble,
      parent,
      isMain,
      options
    );
  }
  if (request.startsWith("@/")) {
    return originalResolveFilename.call(
      this,
      resolve(projectRoot, "src", request.slice(2)),
      parent,
      isMain,
      options
    );
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};
