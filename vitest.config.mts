import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": root("./src"),
      "server-only": root("./tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    globalSetup: ["tests/integration/global-setup.ts"],
    // Entegrasyon testleri ayrı bir SQLite dosyası kullanır; geliştirme veritabanına dokunulmaz
    env: {
      DATABASE_URL: "file:./vitest.db",
      APP_URL: "http://localhost:3000",
      SESSION_SECRET: "vitest-session-secret-0123456789abcdef0123",
      PAYMENT_PROVIDER: "mock",
      PAYMENT_MODE: "test",
    },
    fileParallelism: false,
  },
});
