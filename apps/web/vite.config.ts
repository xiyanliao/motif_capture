import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          audio: ["tone", "@tonejs/midi"],
          react: ["react", "react-dom"],
          storage: ["dexie"]
        }
      }
    }
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"]
  }
});
