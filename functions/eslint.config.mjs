// @ts-check
import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

const useClock = "Bruk Clock fra src/domain/clock.ts (regel 6).";

export default defineConfig(
  { ignores: ["lib/**"] },
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          // Konfigfiler utenfor src/ (ikke med i tsconfig) typesjekkes i et standardprosjekt
          allowDefaultProject: ["vitest.config.ts"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // JS-filer (f.eks. denne konfigen) er ikke med i tsconfig: ingen typesjekkede regler
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // Regel 6: all tid går via Clock
  {
    files: ["src/**/*.ts"],
    ignores: ["src/domain/clock.ts"],
    rules: {
      "no-restricted-properties": [
        "error",
        { object: "Date", property: "now", message: useClock },
      ],
      "no-restricted-syntax": [
        "error",
        { selector: "NewExpression[callee.name='Date'][arguments.length=0]", message: useClock },
      ],
    },
  },

  // Regel 1: matchemotoren er ren
  {
    files: ["src/matching/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["firebase-functions", "firebase-functions/*", "firebase-admin", "firebase-admin/*"],
              message: "Matchemotoren skal ikke kjenne Firebase (regel 1).",
            },
            {
              group: ["node:*", "fs", "http", "https", "net"],
              message: "Ingen I/O i matchemotoren (regel 1).",
            },
          ],
        },
      ],
    },
  },
);