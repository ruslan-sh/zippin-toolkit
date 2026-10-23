const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");

module.exports = [
    {
        ignores: ["dist/**", "webpack.*", "eslint.config.js"],
    },
    {
        files: ["**/*.{js,mjs,cjs,ts,tsx,mts,cts}"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
        },
    },
    {
        files: ["**/*.{ts,tsx,mts,cts}"],
        languageOptions: {
            parser: tsParser,
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                },
            ],
            "no-console": "error",
        },
    },
    {
        files: ["**/*.{js,mjs,cjs}"],
        rules: {
            "no-console": "error",
        },
    },
];
