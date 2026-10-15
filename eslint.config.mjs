import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Accessibility: jsx-a11y "strict" rules (next/core-web-vitals only enables a handful). The
    // plugin is already registered by eslint-config-next, so only settings and rules are added.
    // Next's `Link` renders an <a> and `Image` an <img>: map them so anchor/alt rules check them
    // like the native elements. Add the project's own wrappers here (e.g. ButtonLink: "a").
    settings: { "jsx-a11y": { components: { Link: "a", Image: "img" } } },
    rules: {
      ...jsxA11y.flatConfigs.strict.rules,
      // `strict` replaces eslint-config-next's `alt-text` override for `Image`: reapply it.
      "jsx-a11y/alt-text": ["error", { elements: ["img"], img: ["Image"] }],
    },
  },
  {
    rules: {
      // Allow the common "omit a key via destructuring" pattern (const { id: _id, ...rest } = x)
      // without a warning — the underscore prefix is the explicit opt-out signal. This mirrors
      // what TypeScript's noUnusedLocals/noUnusedParameters already tolerate natively for
      // destructuring patterns and function parameters (but not a bare unused `const _x = 1`).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Project-specific:
    ".claude/**",
    "coverage/**",
    "test-results/**",
    "playwright-report/**",
    "blob-report/**",
  ]),
]);

export default eslintConfig;
