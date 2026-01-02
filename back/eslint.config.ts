import eslintParserTypeScript from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier/flat";
import { defineConfig } from "eslint/config";
import path from "path";
import tseslint from "typescript-eslint";

import { includeIgnoreFile } from "@eslint/compat";

const gitignorePath = path.resolve(import.meta.dirname, "../.gitignore");

const eslintConfig = defineConfig([
    includeIgnoreFile(gitignorePath),
    {
        files: ["**/*.{ts,cts,mts}"],
        ignores: ["webpack.config.ts"],
        languageOptions: {
            parser: eslintParserTypeScript,
            parserOptions: {
                project: true,
                tsconfigRootDir: import.meta.dirname
            },
        },
        extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
        rules: {
            "@typescript-eslint/restrict-template-expressions": "off",
            "@typescript-eslint/no-extraneous-class": "off"
        },
    },
    prettier,
]);

export default eslintConfig;
