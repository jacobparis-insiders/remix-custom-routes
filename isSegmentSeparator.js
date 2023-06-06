const path = require("path")

/** @param {string | undefined} checkChar
 * @returns {boolean}
 */
function isSegmentSeparator(checkChar) {
  if (!checkChar) return false
  return ["/", ".", path.win32.sep].includes(checkChar)
}
exports.isSegmentSeparator = isSegmentSeparator
