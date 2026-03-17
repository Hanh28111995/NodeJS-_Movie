import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["node_modules/**", "src/uploads/**", "public/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
      "no-unsafe-negation": "off",
      "no-dupe-keys": "off",
    },
  },
];
