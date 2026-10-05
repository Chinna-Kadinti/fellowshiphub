import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const outputDirectory = "dist";
const serverDirectory = join(outputDirectory, "server");

rmSync(outputDirectory, { recursive: true, force: true });
cpSync(".open-next", serverDirectory, { recursive: true });
copyFileSync(join(serverDirectory, "worker.js"), join(serverDirectory, "index.js"));

if (existsSync(".openai/hosting.json")) {
  mkdirSync(join(outputDirectory, ".openai"), { recursive: true });
  copyFileSync(".openai/hosting.json", join(outputDirectory, ".openai", "hosting.json"));
}

cpSync(".open-next/assets", join(outputDirectory, "assets"), { recursive: true });
