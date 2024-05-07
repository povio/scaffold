// Eslint configuration file

// enforce file structure, see docs/template/docs/template/02_Architecture.md
var noRestrictedImportsRule =
  {
    paths: [
      // prevent the use of LoggerService from @nestjs/common
      { name: '@nestjs/common', importNames: ['LoggerService'], message: 'Use "~common/logging" instead' },
    ],
    patterns: [
      // prevent the import from virtual packages
      { group: ['.store/*'], message: 'Import from virtual package' },
      { group: ['*/index.ts'], message: 'Import from virtual package' },
    ],
  };


module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'eslint-plugin-import-helpers'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    // allow console.logs but output a warning
    'no-console': ['warn'],
    // force no un-used imports
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error'],
    // enforce import ordering that prevents module detection issues, see docs/template/docs/template/02_Architecture.md
    'import-helpers/order-imports': [
      'error',
      {
        newlinesBetween: 'always',
        groups: ['module', '/^~vendors/', '/^~common/', '/^~database/', '/^~/', ['parent', 'sibling', 'index']],
        alphabetize: { order: 'asc', ignoreCase: true },
      },
    ],
    // maintain end of lines
    'prettier/prettier': ['error', { endOfLine: 'auto' }],

    'no-restricted-imports': [
      'error',
      noRestrictedImportsRule,
    ],
  },
  overrides: [
    // allow console.log in tests and utilities
    { files: ['*.(unit|spec|e2e|e2e-spec).ts'], rules: { 'no-console': 0 } },
    { files: ['*.js'], rules: { '@typescript-eslint/no-var-requires': 0 } },
  ].concat([
    // folders
    [['*/common/**/*.ts'], ['~modules/*', '~database/*']],
    [['*/database/**/*.ts'], ['~modules/*', '~database/*']],
    [['*/vendors/**/*.ts'], ['~modules/*', '~database/*', '~common/*']],
  ].map(function(o) {
    return {
      files: o[0],
      rules: {
        'no-restricted-imports': ['error', {
          paths: noRestrictedImportsRule.paths,
          patterns: [
            // prevent the import from virtual packages
            { group: o[1], message: 'Import from wrong location' },
          ].concat(noRestrictedImportsRule.patterns),
        }],
      },
    };
  })),
};
