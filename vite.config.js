import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",

  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    outDir: "./compiled",
  },
  plugins: [react()],
});
