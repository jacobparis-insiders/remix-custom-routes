const fs = require("fs")
const path = require("path")

module.exports = {
  ensureRootRouteExists,
}

/**
 *
 * @param {string} appDirectory
 * @param {object} options
 * @param {string[]} [options.extensions] - The basename of the root route module
 * @returns string
 */
function ensureRootRouteExists(appDirectory, options = {}) {
  const extensions = options.extensions ?? [".js", ".jsx", ".ts", ".tsx"]

  for (const ext of extensions) {
    const name = "root" + ext
    const file = path.join(appDirectory, name)

    if (fs.existsSync(file)) {
      return file
    }
  }

  throw new Error(
    `Could not find a root route module in the app directory: ${appDirectory}`,
  )
}
