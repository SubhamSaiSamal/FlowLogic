import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': ['error', {
        // `const { node, ...props } = x` is the standard way to strip a key
        // before spreading the rest onto a DOM element — react-markdown
        // overrides and the zustand `partialize` both rely on it. Those
        // bindings are unused *on purpose*; flagging them was noise, and
        // "fixing" them by deleting the binding would have spread `node`
        // straight onto real DOM nodes.
        ignoreRestSiblings: true,
        // Conventional opt-out for deliberately-ignored bindings.
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
    },
  },
  {
    // Build/tooling config runs in Node, not the browser — without this
    // `process.env` reads as an undefined global.
    files: ['vite.config.js', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
])
