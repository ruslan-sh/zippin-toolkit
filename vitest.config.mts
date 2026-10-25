import { defineConfig } from "vitest/config";

export default defineConfig({
  oxc: { jsx: { importSource: "preact" } },
  test: {
    environment: "jsdom",
    include: ["src/apps/calendar/**/__tests__/*.test.tsx", "src/shared/**/__tests__/*.test.tsx"],
    setupFiles: ["./src/shared/components/__tests__/setup.ts"],
  },
});
