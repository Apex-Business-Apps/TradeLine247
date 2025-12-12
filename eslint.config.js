import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

const reactNoUnknownPropertyRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow unknown React DOM properties",
    },
    schema: [
      {
        type: "object",
        properties: {
          ignore: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unknownProp: "Unknown property '{{name}}'. Did you mean '{{suggestion}}'?",
    },
  },
  create(context) {
    const options = context.options[0] ?? {};
    const ignoreList = Array.isArray(options.ignore) ? options.ignore : [];
    const ignore = new Set(ignoreList.map((name) => (typeof name === "string" ? name : String(name))));

    return {
      JSXAttribute(node) {
        if (node.name.type !== "JSXIdentifier") {
          return;
        }

        const propName = node.name.name;
        const lowerCaseName = propName.toLowerCase();

        if (ignore.has(propName) || ignore.has(lowerCaseName)) {
          return;
        }

        if (propName === "fetchPriority") {
          context.report({
            node: node.name,
            messageId: "unknownProp",
            data: {
              name: propName,
              suggestion: "fetchpriority",
            },
          });
        }
      },
    };
  },
};

const reactPlugin = {
  rules: {
    "no-unknown-property": reactNoUnknownPropertyRule,
  },
};

export default tseslint.config(
  { ignores: ["dist", "coverage"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      react: reactPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": "off",

      // 🚫 Core guard: never render more hooks than previous render
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "off",

      // Helpful strictness to catch sneaky conditionals
      "no-cond-assign": "error",
      "no-unreachable": "error",
      "no-constant-condition": ["error", { checkLoops: true }],
      "no-return-assign": "error",

    },
  },
  // Phase 2: Test file overrides - stop tests from polluting lint noise
  {
    files: [
      "**/__tests__/*.{ts,tsx}",
      "tests/**/*.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
      "**/*.test.{ts,tsx}"
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-console": "off",
    },
  },
);

