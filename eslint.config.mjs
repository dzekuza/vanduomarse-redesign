import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // WordPress plugin: plain browser scripts loaded by WordPress, not part of the app build.
    "wordpress/**",
    // React Native (Expo) mobile app: has its own tsconfig and lint setup.
    "mobile/**",
    ".claude/**",
    "tools/**",
  ]),
]);

export default eslintConfig;
