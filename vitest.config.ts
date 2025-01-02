/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts"
    // you can uncomment the following line if you want code coverage
    // coverage: {
    //   provider: 'c8'
    // },
  }
});
