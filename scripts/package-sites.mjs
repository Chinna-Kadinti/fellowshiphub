import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outputDirectory = "dist";
const serverDirectory = join(outputDirectory, "server");

rmSync(outputDirectory, { recursive: true, force: true });
cpSync(".open-next", serverDirectory, { recursive: true });
copyFileSync(join(serverDirectory, "worker.js"), join(serverDirectory, "index.js"));

const handlerPath = join(serverDirectory, "server-functions", "default", "handler.mjs");
const requireShim =
  'import { createRequire as createNodeRequire } from "node:module";\n' +
  'const require = createNodeRequire("/worker/index.js");\n';
const handlerSource = readFileSync(handlerPath, "utf8");
if (!handlerSource.includes('const require = createNodeRequire("/worker/index.js")')) {
  const workerCompatibleHandler = handlerSource.replace(
    'function setNextjsServerWorkingDirectory(){process.chdir("")}',
    "function setNextjsServerWorkingDirectory(){}"
  );
  writeFileSync(handlerPath, requireShim + workerCompatibleHandler);
}

if (existsSync(".openai/hosting.json")) {
  mkdirSync(join(outputDirectory, ".openai"), { recursive: true });
  copyFileSync(".openai/hosting.json", join(outputDirectory, ".openai", "hosting.json"));
}

cpSync(".open-next/assets", join(outputDirectory, "assets"), { recursive: true });
