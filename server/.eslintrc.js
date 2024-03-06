module.exports = {
    root: true,
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        'plugin:security/recommended-legacy'
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: false,
    },
};