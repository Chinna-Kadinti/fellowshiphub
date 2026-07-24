import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const packageFile = fileURLToPath(
  new URL("../ios/App/CapApp-SPM/Package.swift", import.meta.url)
);

if (existsSync(packageFile)) {
  const source = readFileSync(packageFile, "utf8");
  const normalized = source.replace(
    /path: "([^"]+)"/g,
    (_match, packagePath) => `path: "${packagePath.replaceAll("\\", "/")}"`
  );

  if (normalized !== source) {
    writeFileSync(packageFile, normalized, "utf8");
    process.stdout.write("Normalized iOS Swift package paths.\n");
  }
}
