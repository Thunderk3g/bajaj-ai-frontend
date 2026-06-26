import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// Reuses the app's `@` alias and the React plugin; runs in jsdom so the
// component/hook tests have a DOM.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/monitoring/__tests__/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
