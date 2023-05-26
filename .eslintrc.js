module.exports = {
  env: {
    browser: true,
    jest: true,
    es2021: true
  },
  extends: ['airbnb-base', 'plugin:prettier/recommended'],
  overrides: [],
  plugins: ['unused-imports', 'import'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Indentation
    indent: ['error', 2],
    'no-tabs': 'error',

    // Variables
    'no-var': 'error',
    'prefer-const': 'error',

    // Function and Arrow Function
    'arrow-spacing': 'error',
    'no-confusing-arrow': 'error',
    'no-useless-constructor': 'error',

    // Strings
    quotes: ['error', 'single', { avoidEscape: true }],

    // Arrays and Objects
    'no-array-constructor': 'error',
    'no-new-object': 'error',

    // Destructuring
    'prefer-destructuring': ['error', { object: true, array: false }],

    // Class
    'no-dupe-class-members': 'error',

    // Modules
    'import/no-unresolved': 'off',
    'import/named': 'error',
    'import/default': 'error',
    'import/namespace': 'error',
    'import/export': 'error',

    // Others
    'no-console': 'off',
    'no-alert': 'error',
    'no-debugger': 'error',
    'no-unused-vars': 'error',
    'unused-imports/no-unused-imports': 'error',
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: ['**/__test__/**']
      }
    ],
    'import/extensions': [
      'off',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never'
      }
    ]
  }
};
