# remix-custom-routes

A package to make custom routes easier in Remix.

## Installation

```bash
npm install remix-custom-routes
```

## Route Extensions Convention

You can choose the [Remix Route Extension](./routeExtensions/README.md) convention to get the following behaviour.

- Instead of a `/routes` directory, routes can be defined in any directory (within `/app` but not at the top level).
- Any file with the extension `.route.tsx`, `.route.ts`, `.route.jsx`, or `.route.js` will be treated as a route.
- All other files are ignored, so you can safely put non-route files next to your routes. Components, hooks, images, etc.
- URLs are determined by the filename, just like [Remix's v2 route convention](https://remix.run/docs/en/main/file-conventions/route-files-v2).
- Folders do not participate in routing, so you can organize your routes however you want. As long as the file has `.route` in the name, Remix will find it and turn it into a route.

```ts
//remix-config.js
const { routeExtensions } = require("remix-custom-routes")

module.exports = {
  ignoredRouteFiles: ["routes/**.*"], // ignore the default route files
  async routes() {
    const appDirectory = path.join(__dirname, "app")

    return routeExtensions(appDirectory)
  },
}
```

## Flat Route Convention

You can choose the [Flat Route](./flatRoutes/README.md) convention to get the following behaviour, based on [Kiliman's remix-flat-routes](https://github.com/kiliman/remix-flat-routes) package.

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

## Custom Routes

This package exposes two functions, `getRouteIds` and `getRouteManifest`, that make it easier to create custom routes in Remix.

The flat route convention defined above is identical to the following code.

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

Use any tool you want, such as glob, to get a list of files that should be turned into routes. If you have a custom convention, you are free to manipulate the list of files however you want. before passing it to `getRouteIds`.

```ts
interface GetRouteIdsOptions {
  prefix?: string // removed from the start of the route
  suffix?: string // removed from the end of the route
  indexNames?: string[] // names of files that should be treated as index files
}

function getRouteIds(
  routes: string[],
  options: GetRouteIdsOptions,
): [string, string][]
```

`getRouteIds` takes an array of file paths and returns an array of tuples. Each tuple contains the route ID and its corresponding file path.

This is the format that `getRouteManifest` expects.

```ts
interface RouteManifest {
  [key: string]: Route
}

function getRouteManifest(sortedRouteIds: [string, string][]): RouteManifest
```

`getRouteManifest` reads the route IDs and links each route to its parent and children while ensuring there are no conflicts. It returns a Remix manifest object that can be passed to Remix's `routes()` function.
