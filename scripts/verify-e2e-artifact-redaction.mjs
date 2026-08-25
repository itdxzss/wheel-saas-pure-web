import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
const playwrightCli = require.resolve("@playwright/test/cli");
const sentinel = `artifact-redaction-${randomUUID()}`;
const expectedFailureMarker = `artifact-probe-failure-${randomUUID()}`;
const artifactRoots = [
  join(projectRoot, "test-results", "artifact-redaction"),
  join(projectRoot, "playwright-report", "artifact-redaction")
];

const run = spawnSync(
  process.execPath,
  [playwrightCli, "test", "e2e/artifact-redaction.probe.spec.ts"],
  {
    cwd: projectRoot,
    env: {
      ...process.env,
      ARMADA_E2E_ARTIFACT_REDACTION_SENTINEL: sentinel,
      ARMADA_E2E_ARTIFACT_REDACTION_FAILURE_MARKER: expectedFailureMarker,
      ARMADA_E2E_BASE_URL: "http://127.0.0.1:8848",
      ARMADA_E2E_USERNAME: sentinel,
      ARMADA_E2E_PASSWORD: sentinel,
      PLAYWRIGHT_NO_COPY_PROMPT: "1"
    },
    encoding: "utf8"
  }
);

if (run.error) throw run.error;
if (run.status !== 1) {
  throw new Error(`脱敏探针应以预期失败结束，实际退出码为 ${run.status}`);
}

async function filesBelow(root) {
  const result = [];
  const entries = await readdir(root, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) result.push(...(await filesBelow(path)));
    else if (entry.isFile()) result.push(path);
  }
  return result;
}

const artifactFiles = (
  await Promise.all(artifactRoots.map(root => filesBelow(root)))
).flat();
const sentinelBytes = Buffer.from(sentinel);
const markerBytes = Buffer.from(expectedFailureMarker);
const leakedFiles = [];
let expectedFailureRecorded = false;

for (const path of artifactFiles) {
  const content = await readFile(path);
  if (content.includes(sentinelBytes))
    leakedFiles.push(relative(projectRoot, path));
  if (content.includes(markerBytes)) expectedFailureRecorded = true;
}

if (!expectedFailureRecorded) {
  throw new Error("脱敏探针没有运行到预期失败点，不能信任扫描结果");
}
if (leakedFiles.length > 0) {
  throw new Error(`凭据哨兵出现在测试产物中：${leakedFiles.join(", ")}`);
}

console.log(`artifact redaction PASS (${artifactFiles.length} files, 0 leaks)`);
