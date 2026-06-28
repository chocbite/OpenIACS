/// <reference types="vitest/config" />
import { playwright } from "@vitest/browser-playwright";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 9998,
    host: true,
  },
  build: {
    outDir: path.resolve(__dirname, "dist"),
    chunkSizeWarningLimit: 2000,
    emptyOutDir: true,
  },
  root: path.resolve(__dirname, "src"),
  test: {
    browser: {
      provider: playwright(),
      enabled: true,
      instances: [{ browser: "chromium" }],
    },
  },
  resolve: {
    alias: {
      "@package": path.resolve(__dirname, "package.json"),

      //Lib
      "@libComposition": path.resolve(__dirname, "./src/lib/composition/index"),
      "@libPrompts": path.resolve(__dirname, "./src/lib/prompts/index"),
    },
  },
});
