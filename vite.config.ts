import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" la bat buoc de app chay dung khi Electron load file index.html
// bang giao thuc file:// sau khi build (khong phai http://)
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
