import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/fintech-dashboard/",
  plugins: [react()],
  build: {
    outDir: "Output",
    emptyOutDir: true,
  },
});
