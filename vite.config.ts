import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  optimizeDeps: {
    include: ["@babylonjs/core"],
  },
  server: {
    open: true,
    port: 3000,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
  },
  publicDir: "assets",
});
