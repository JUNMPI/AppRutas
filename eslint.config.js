// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  ignores: [
    'dist/*',
    'node_modules/*',
    '*.js',
    'check-setup.js',
    'scripts/*.js',
    'backend/**/*',
    '.expo/*',
    'babel.config.js',
    'metro.config.js'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', {
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_',
      'caughtErrorsIgnorePattern': '^_'
    }],
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    'no-unused-vars': 'off',
  }
};