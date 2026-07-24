import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command, mode }) => {
  if (command === "build") {
    const apiUrl = process.env.VITE_API_URL || loadEnv(mode, process.cwd(), "").VITE_API_URL;
    if (!apiUrl) {
      throw new Error(
        "VITE_API_URL is required for a mobile build. Copy .env.example to .env and set the deployed HTTPS backend origin."
      );
    }

    let parsed: URL;
    try {
      parsed = new URL(apiUrl);
    } catch {
      throw new Error("VITE_API_URL must be a valid absolute URL.");
    }
    if (parsed.protocol !== "https:") {
      throw new Error("VITE_API_URL must use HTTPS for Android and iOS release builds.");
    }
    if (
      parsed.username ||
      parsed.password ||
      (parsed.pathname !== "/" && parsed.pathname !== "") ||
      parsed.search ||
      parsed.hash
    ) {
      throw new Error("VITE_API_URL must contain only the backend origin, without a path, query, or credentials.");
    }
  }

  return {
    base: "./",
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true
    },
    preview: {
      port: 4173,
      strictPort: true
    }
  };
});
