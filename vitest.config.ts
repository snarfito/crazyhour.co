import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    // Integration test suites (categorias/actions.test.ts, productos/actions.test.ts)
    // both hit the same local-Supabase Postgres instance and wipe the shared
    // "categories" table in beforeEach. Vitest runs test files in parallel by
    // default, which races these suites against each other's table state and
    // produces intermittent "Cannot read properties of null" / FK-violation
    // failures. Serializing file execution avoids that shared-state race.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
