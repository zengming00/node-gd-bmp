module.exports = {
    env: {
        es2021: true,
        node: true,
    },
    extends: [
        'standard'
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module',
    },
    plugins: [
        '@typescript-eslint'
    ],
    rules: {
        'padded-blocks': 'off',
        'one-var': 'off',
        'no-multiple-empty-lines': 'off',
        'space-before-function-paren': ['error', {
            'anonymous': 'always',
            'named': 'never',
            'asyncArrow': 'never',
        }],
        'indent': ['error', 4, {
            'SwitchCase': 1,
        }],
        'semi': ['error', 'always'],
        'quote-props': ['error', 'consistent'],
        'comma-dangle': ['error', {
            'arrays': 'never',
            'objects': 'always-multiline',
            'imports': 'never',
            'exports': 'never',
            'functions': 'never',
        }],
    },
};
