# Remix Flat Routes Convention

This convention is based on [Kiliman's remix-flat-routes](https://github.com/kiliman/remix-flat-routes) package.

- Routes are defined in a `/routes` directory.
- URLs are determined by the filename, just like [Remix's v2 route convention](https://remix.run/docs/en/main/file-conventions/route-files-v2).
- A folder ending in `+` will have its path prefixed to all child routes. This allows you to avoid repeating the same prefix for all routes in a folder.

```ts
//remix-config.js
const { flatRoutes } = require("remix-custom-routes")

module.exports = {
  ignoredRouteFiles: ["routes/**.*"], // ignore the default route files
  async routes() {
    const appDirectory = path.join(__dirname, "app")

    return flatRoutes(appDirectory)
  },
}
```

## Implementation

The `flatRoutes` export is a shortcut for the following code. Feel free to use the unbundled functions if you would like more control over the implementation.

```ts
//remix-config.js
const glob = require("glob")
const {
  getRouteIds,
  getRouteManifest,
  ensureRootRouteExists,
} = require("remix-custom-routes")

module.exports = {
  async routes() {
    const appDirectory = path.join(__dirname, "app")
    ensureRootRouteExists(appDirectory)

    // array of paths to files
    const files = glob.sync("routes/*.{js,jsx,ts,tsx,md,mdx}", {
      cwd: appDirectory,
    })

    // array of tuples [routeId, filePath]
    const routeIds = getRouteIds(files, {
      indexNames: ["index", "route", "_index", "_route"],
    })

    // Remix manifest object
    return getRouteManifest(routeIds)
  },
}
```
