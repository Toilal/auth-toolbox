module.exports = {
  extends: 'standard-with-typescript',
  parserOptions: {
    project: './tsconfig.json'
  },
  rules: {
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'off'
  },
  overrides: [{
    files: ['test/**/*'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off'
    }
  }]
}
