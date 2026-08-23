import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "build/**",
      ".output/**",
      ".vercel/**",
      ".wrangler/**",
      ".nitro/**",
      "node_modules/**",
      "src/routeTree.gen.ts",
      "webhook/**",
      // Stray Cursor editor install sitting in the repo root (see .gitignore) —
      // .gitignore doesn't apply to ESLint, and without these it tries to parse
      // Cursor's bundled Electron/Chromium JS and runs out of heap memory.
      "resources/**",
      "locales/**",
      "policies/**",
      "tools/**",
      // Leftovers from an earlier, abandoned Next.js setup.
      ".next/**",
      "app.backup/**",
      "components.backup/**",
      "lib.backup/**",
      "next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      prettier: prettierPlugin,
    },
    rules: {
      ...reactHooks.configs["recommended-latest"].rules,
      ...reactRefresh.configs.vite.rules,
      ...prettierConfig.rules,
      "prettier/prettier": "warn",
      "@typescript-eslint/no-unused-vars": "off",
      // shadcn/ui components routinely export a `*Variants` cva() helper
      // alongside the component — normal for this stack, not a real issue.
      "react-refresh/only-export-components": "warn",
    },
  },
);
