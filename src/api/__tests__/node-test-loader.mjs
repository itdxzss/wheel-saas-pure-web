import { existsSync } from "node:fs";
import { resolve as pathResolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = pathResolve(import.meta.dirname, "../../..");
const armadaDouble = pathResolve(import.meta.dirname, "armada-test-double.ts");
const httpDouble = pathResolve(import.meta.dirname, "http-test-double.ts");
const timeDouble = pathResolve(import.meta.dirname, "time-test-double.ts");
const messageDouble = pathResolve(import.meta.dirname, "message-test-double.ts");

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "@/api/armada") {
    return { url: pathToFileURL(armadaDouble).href, shortCircuit: true };
  }
  if (specifier === "@/utils/http") {
    return { url: pathToFileURL(httpDouble).href, shortCircuit: true };
  }
  if (specifier === "@/utils/time") {
    return { url: pathToFileURL(timeDouble).href, shortCircuit: true };
  }
  if (specifier === "@/utils/message") {
    return { url: pathToFileURL(messageDouble).href, shortCircuit: true };
  }
  if (specifier.startsWith("@/")) {
    const target = pathResolve(projectRoot, "src", `${specifier.slice(2)}.ts`);
    return { url: pathToFileURL(target).href, shortCircuit: true };
  }
  if (
    context.parentURL &&
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    !specifier.endsWith(".ts") &&
    !specifier.endsWith(".mjs") &&
    !specifier.endsWith(".js")
  ) {
    const targetUrl = new URL(`${specifier}.ts`, context.parentURL);
    if (existsSync(fileURLToPath(targetUrl))) {
      return { url: targetUrl.href, shortCircuit: true };
    }
  }
  return nextResolve(specifier, context);
}
