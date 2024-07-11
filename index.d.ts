declare module "remix-custom-routes" {
  interface Route {
    file: string
    id: string
    index: boolean
    path: string
    parentId: string
  }

  interface RouteManifest {
    [key: string]: Route
  }

  export function flatRoutes(appDirectory: string): RouteManifest

  export function routeExtensions(appDirectory: string): RouteManifest

  export function ensureRootRouteExists(
    appDirectory: string,
    options?: {
      extensions?: string[]
    },
  ): string

  export function getRouteIds(
    routes: string[],
    options: {
      prefix?: string
      suffix?: string
      indexNames?: string[]
    },
  ): [string, string][]

  export function getRouteManifest(
    sortedRouteIds: [string, string][],
  ): RouteManifest
}
