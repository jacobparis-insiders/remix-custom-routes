/**
 * @type {import('@types/eslint').Linter.BaseConfig}
 */
module.exports = {
  parserOptions: {
    ecmaVersion: "latest",
  },
  extends: ["prettier", "plugin:markdown/recommended"],
}
