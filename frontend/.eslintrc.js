module.exports = {
    root: true,
    extends: ["@react-native", "plugin:@typescript-eslint/recommended"],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    rules: {
        "react-native/no-inline-styles": "off",
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
        "react-hooks/exhaustive-deps": "warn",
    },
    ignorePatterns: ["node_modules/", "android/", "ios/", ".expo/"],
};