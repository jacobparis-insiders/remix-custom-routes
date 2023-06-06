const { ensureRootRouteExists } = require("./ensureRootRouteExists")
const { flatRoutes } = require("./flatRoutes/flatRoutes")
const { routeExtensions } = require("./routeExtensions/routeExtensions")
const { getRouteIds, getRouteManifest } = require("./core")

module.exports = {
  flatRoutes,
  routeExtensions,
  ensureRootRouteExists,
  getRouteIds,
  getRouteManifest,
}
