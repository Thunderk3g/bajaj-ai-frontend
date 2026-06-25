import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// Served by nginx at `location /` on the platform VM, so base is root.
// All assets resolve under `/assets/*`, which falls through to this app's
// default location block (the agents own `/compliance`, `/seo`, `/pgadmin`).
export default defineConfig({
  base: "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
