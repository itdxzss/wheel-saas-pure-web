import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const originalResolveFilename = require("node:module")._resolveFilename;
const projectRoot = resolve(import.meta.dirname, "../../..");
const armadaDouble = resolve(
  import.meta.dirname,
  "armada-test-double.ts"
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
