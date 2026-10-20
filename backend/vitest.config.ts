import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
    // PGlite takes a few seconds to start.
    hookTimeout: 30_000,
    testTimeout: 20_000,
  },
});
