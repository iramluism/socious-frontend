import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://socious.local.com",
        changeOrigin: true,
      },
    },
  },
  test: { environment: "jsdom", setupFiles: ["./tests/setup.ts"], css: false },
});
