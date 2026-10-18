import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";

const BACKEND = "http://socious.local.com";

function rewriteOAuthCallback(): Plugin {
  const rewrite = (
    req: { url?: string },
    _res: unknown,
    next: () => void,
  ) => {
    if (!req.url) {
      next();
      return;
    }
    const [path, query] = req.url.split("?");
    if (path === "/oauth/callback") {
      req.url = "/oauth/callback.html" + (query ? `?${query}` : "");
    }
    next();
  };
  return {
    name: "oauth-callback-bridge",
    configureServer(server) {
      server.middlewares.use(rewrite);
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite);
    },
  };
}

export default defineConfig({
  plugins: [react(), rewriteOAuthCallback()],
  server: {
    host: "127.0.0.1",
    strictPort: true,
    proxy: {
      "/api": {
        target: BACKEND,
        changeOrigin: true,
      },
      "/oauth": {
        target: BACKEND,
        changeOrigin: true,
        bypass(req) {
          const path = (req.url || "").split("?")[0];
          if (path === "/oauth/callback" || path === "/oauth/callback.html") {
            return req.url;
          }
        },
      },
    },
  },
  test: { environment: "jsdom", setupFiles: ["./tests/setup.ts"], css: false },
});
