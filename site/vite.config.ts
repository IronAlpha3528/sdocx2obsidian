import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Plugin to serve vendor assets and worker.js as raw static files in Vite dev server.
 * This prevents Vite from running `vite:import-analysis` on Pyodide's internal
 * dynamic imports (e.g. `await import(e)` in pyodide.js) and guarantees proper MIME types.
 */
function rawStaticServe() {
  return {
    name: "raw-static-serve",
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const url = req.url ? req.url.split("?")[0] : "";
        if (url.startsWith("/vendor/") || url === "/worker.js") {
          const relativePath = url.startsWith("/") ? url.slice(1) : url;
          const filePath = path.resolve(__dirname, relativePath);

          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            const mimeTypes: Record<string, string> = {
              ".js": "application/javascript",
              ".mjs": "application/javascript",
              ".wasm": "application/wasm",
              ".whl": "application/octet-stream",
              ".zip": "application/zip",
              ".json": "application/json",
            };

            res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
            res.setHeader("Cache-Control", "no-cache");
            fs.createReadStream(filePath).pipe(res);
            return;
          }
        }
        next();
      });
    },
    closeBundle() {
      // In production build, copy worker.js and vendor assets directly into dist/
      const distDir = path.resolve(__dirname, "dist");
      const workerSrc = path.resolve(__dirname, "worker.js");
      const workerDest = path.resolve(distDir, "worker.js");
      const vendorSrc = path.resolve(__dirname, "vendor");
      const vendorDest = path.resolve(distDir, "vendor");

      if (fs.existsSync(workerSrc)) {
        fs.copyFileSync(workerSrc, workerDest);
      }
      if (fs.existsSync(vendorSrc)) {
        fs.cpSync(vendorSrc, vendorDest, { recursive: true });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), rawStaticServe()],
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
