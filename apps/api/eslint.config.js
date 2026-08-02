const tsEslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');

module.exports = [
  {
    ignores: ['dist/**', 'node_modules/**', '**/*.js', '**/*.spec.ts', '**/*.e2e-spec.ts'],
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsEslint,
    },
    rules: {
      ...tsEslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/no-restricted-types': ['error', {
        types: {
          'Record<string, any>': { message: 'Use Record<string, unknown> or a specific interface instead', fixWith: 'Record<string, unknown>' },
        },
      }],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CatchClause > BlockStatement:not(:has(*))',
          message: 'Empty catch blocks hide errors. Add at least a logger.warn() call.',
        },
      ],
    },
  },
];
