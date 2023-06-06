const glob = require("glob")

const { getRouteIds, getRouteManifest } = require("../core")
const { ensureRootRouteExists } = require("../ensureRootRouteExists")

module.exports = {
  routeExtensionsImpl,
  routeExtensions,
}

/**
 * @param {string} appDirectory  The root directory of the Remix app
 *
 * @example
 * ```ts
 *   //remix-config.js
 *   const { routeExtensions } = require("remix-custom-routes")
 *
 *   module.exports = {
 *     async routes() {
 *       const appDirectory = path.join(__dirname, "app")
 *       return routeExtensions(appDirectory)
 *     },
 *   }
 * ```
 */
function routeExtensions(appDirectory) {
  const files = glob.sync("**/*.route.{js,jsx,ts,tsx,md,mdx}", {
    cwd: appDirectory,
  })
  ensureRootRouteExists(appDirectory)

  return routeExtensionsImpl(files)
}

/**
 * @param {string[]} files  An array of file paths that are routes
 */
function routeExtensionsImpl(files) {
  const routeIds = getRouteIds(files, {
    suffix: ".route",
  })

  return getRouteManifest(routeIds)
}
