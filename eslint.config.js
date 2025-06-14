import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import testingLibrary from 'eslint-plugin-testing-library'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'

// Filter out problematic globals with whitespace
const cleanGlobals = (globalsObj) => {
  if (!globalsObj || typeof globalsObj !== 'object') {
    return {}
  }
  const cleaned = {}
  for (const [key, value] of Object.entries(globalsObj)) {
    const trimmedKey = key.trim()
    if (trimmedKey !== key) {
      console.warn(`Skipping global "${key}" due to whitespace`)
      continue
    }
    cleaned[trimmedKey] = value
  }
  return cleaned
}

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '.vite/**',
      'public/**',
      '*.config.js',
      '*.config.ts',
      'eslint.config.js',
      'vite.config.ts',
      'tailwind.config.ts',
      'postcss.config.js',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser: tsparser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...cleanGlobals(globals.browser),
        ...cleanGlobals(globals.es2020),
        console: 'readonly',
        process: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', disallowTypeAnnotations: false },
      ],

      // React Refresh
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // General code quality
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-script-url': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      'template-curly-spacing': ['error', 'never'],
      'no-trailing-spaces': 'error',
      'eol-last': 'error',
      'comma-dangle': ['error', 'always-multiline'],
      'semi': ['error', 'never'],
      'quotes': ['error', 'single', { avoidEscape: true }],

      // Performance and best practices
      'no-duplicate-imports': 'error',
      'no-useless-constructor': 'error',
      'no-useless-rename': 'error',
      'no-useless-return': 'error',
      'prefer-destructuring': ['error', {
        array: false,
        object: true,
      }],

      // Disable some rules that conflict with TypeScript
      'no-undef': 'off',
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['**/__tests__/**/*', '**/*.{test,spec}.*'],
    plugins: {
      'testing-library': testingLibrary,
    },
    rules: {
      'testing-library/prefer-screen-queries': 'error',
      'testing-library/no-unnecessary-act': 'error',
      'testing-library/no-wait-for-multiple-assertions': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
]
