import js from "@eslint/js";
import n from "eslint-plugin-n";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default [
  { ignores: ["node_modules/", "uploads/"] },
  js.configs.recommended,
  n.configs["flat/recommended-module"],
  {
    languageOptions: { globals: globals.node },
    rules: {
      eqeqeq: "error",
      "no-var": "error",
      "prefer-const": "error",
      "no-unused-vars": ["warn", { argsIgnorePattern: "req|res|next|val" }],
      "n/no-process-exit": "off",
    },
  },
  {
    // Tests and this config use dev dependencies
    files: ["test/**/*.js", "eslint.config.js"],
    rules: { "n/no-unpublished-import": "off" },
  },
  // Formatting is left to Prettier
  prettier,
];
