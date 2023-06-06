const path = require("path")

/** @param {string} file
 * @returns {string}
 */
function normalizeSlashes(file) {
  return file.split(path.win32.sep).join("/")
}
exports.normalizeSlashes = normalizeSlashes
