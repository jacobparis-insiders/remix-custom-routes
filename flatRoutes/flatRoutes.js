const glob = require("glob")

const { getRouteIds, getRouteManifest } = require("../core")
const { ensureRootRouteExists } = require("../ensureRootRouteExists")

module.exports = {
  flatRoutesImpl,
  flatRoutes,
}

/**
 * @param {string} appDirectory  The root directory of the Remix app
 *
 * @example
 * ```ts
 *   //remix-config.js
 *   const { flatRoutes } = require("remix-custom-routes")
 *
 *   module.exports = {
 *     async routes() {
 *       const appDirectory = path.join(__dirname, "app")
 *       return flatRoutes(appDirectory)
 *     },
 *   }
 * ```
 */
function flatRoutes(appDirectory) {
  const files = glob.sync("routes/*.{js,jsx,ts,tsx,md,mdx}", {
    cwd: appDirectory,
  })
  ensureRootRouteExists(appDirectory)

  return flatRoutesImpl(files)
}

/**
 * @param {string[]} files  An array of file paths that are routes
 */
function flatRoutesImpl(files) {
  const routeIds = getRouteIds(files, {
    indexNames: ["index", "route", "_index", "_route"],
  })

  return getRouteManifest(routeIds)
}
