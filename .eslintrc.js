module.exports = {
  extends: [
    'standard-with-typescript',
    'plugin:unicorn/recommended'
  ],
  parserOptions: {
    project: './tsconfig.json'
  },
  rules: {
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    'unicorn/prefer-ternary': 'off',
    'unicorn/no-null': 'off'
  },
  plugins: [
    'unicorn'
  ],
  overrides: [{
    files: ['test/**/*'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      'unicorn/consistent-function-scoping': 'off'
    }
  }]
}
