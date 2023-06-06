const path = require("path")
const { PrefixLookupTrie } = require("./PrefixLookupTrie")

const { isSegmentSeparator } = require("./isSegmentSeparator")
const { normalizeSlashes } = require("./normalizeSlashes")

module.exports = {
  getRouteIds,
  getRouteManifest,
  getRouteIdConflictErrorMessage,
  getRoutePathConflictErrorMessage,
}

const paramPrefixChar = /** @type {const} */ "$"
const escapeStart = /** @type {const} */ "["
const escapeEnd = /** @type {const} */ "]"
const optionalStart = /** @type {const} */ "("
const optionalEnd = /** @type {const} */ ")"

/**
 * @typedef {Object} Route
 * @property {string} file - The file path of the route component.
 * @property {string} id - The unique identifier of the route.
 * @property {boolean} index - Whether the route is the index route.
 * @property {string} path - The URL path of the route.
 * @property {string} parentId - The unique identifier of the parent route.
 */
/**
 * @typedef {Object.<string, Route>} RouteManifest
 */

/**
 *
 * @param {string[]} routes
 * @param {object} options
 * @param {string} [options.prefix] - The prefix to remove from the route id
 * @param {string} [options.suffix] - The suffix to remove from the route id
 * @param {string[]} [options.indexNames] - The names to use for index routes
 */
function getRouteIds(routes, options = {}) {
  const prefix = options.prefix ?? ""
  const suffix = options.suffix ?? ""
  const indexNames = options.indexNames ?? []

  const routeIdConflicts = new Map()
  // id -> file
  /** @type {Map<string, string>} */
  const routeIds = new Map()
  for (const file of routes) {
    const normalizedFile = normalizeSlashes(file)
    const routeExt = path.extname(normalizedFile)

    let pathWithoutExt = normalizedFile.slice(
      0,
      0 - routeExt.length - suffix.length,
    )

    if (indexNames.includes(path.basename(pathWithoutExt))) {
      const segments = pathWithoutExt
        .split("/")
        .filter((segment) => !segment.endsWith("+"))

      if (segments.length > 2) {
        // if length = 1 they're in the app directory
        // if length = 2 this is the site index
        // so if length > 2, they're in a subdirectory we can surface
        segments.pop()
        pathWithoutExt = segments.join("/")
      }
    }

    const ancestorSegments = pathWithoutExt
      .split("/")
      .filter((segment) => segment.endsWith("+"))
      .map((segment) => segment.slice(0, -1))

    // If there's off by one errors, it's the .
    const basename = path.basename(pathWithoutExt)
    const routeId = [...ancestorSegments, basename.slice(prefix.length)].join(
      ".",
    )

    const conflict = routeIds.get(routeId)
    if (conflict) {
      let currentConflicts = routeIdConflicts.get(routeId)
      if (!currentConflicts) {
        currentConflicts = [conflict]
      }
      currentConflicts.push(normalizedFile)
      routeIdConflicts.set(routeId, currentConflicts)
      continue
    }
    routeIds.set(routeId, normalizedFile)
  }

  if (routeIdConflicts.size > 0) {
    for (const [id, files] of routeIdConflicts.entries()) {
      console.error(getRouteIdConflictErrorMessage(id, files))
    }
  }

  return Array.from(routeIds).sort(([a], [b]) => b.length - a.length)
}

/**
 * @param {[string, string][]} sortedRouteIds
 */
function getRouteManifest(sortedRouteIds) {
  /** @type {RouteManifest} */
  const routeManifest = {}
  const prefixLookup = new PrefixLookupTrie()

  for (const [id, file] of sortedRouteIds) {
    routeManifest[id] = {
      file,
      id,
      index: id.endsWith("_index"),
      path: getRouteSegments(id),
    }

    const childRouteIds = prefixLookup.findAndRemove(id, (value) => {
      return [".", "/"].includes(value.slice(id.length).charAt(0))
    })

    prefixLookup.add(id)
    if (childRouteIds.length > 0) {
      for (const childRouteId of childRouteIds) {
        routeManifest[childRouteId].parentId = id
      }
    }
  }

  const urlConflicts = new Map()
  const uniqueRoutes = new Map()
  for (const [id] of sortedRouteIds) {
    const route = routeManifest[id]

    const originalPathname = route.path || ""
    let pathname = route.path
    const parentConfig = route.parentId ? routeManifest[route.parentId] : null
    if (parentConfig?.path && pathname) {
      pathname = pathname
        .slice(parentConfig.path.length)
        .replace(/^\//, "")
        .replace(/\/$/, "")
    }
    const conflictRouteId = originalPathname + (route.index ? "?index" : "")
    const conflict = uniqueRoutes.get(conflictRouteId)
    if (!route.parentId) route.parentId = "root"
    route.path = pathname || undefined
    uniqueRoutes.set(conflictRouteId, route)
    if (conflict && (originalPathname || route.index)) {
      let currentConflicts = urlConflicts.get(originalPathname)
      if (!currentConflicts) currentConflicts = [conflict]
      currentConflicts.push(route)
      urlConflicts.set(originalPathname, currentConflicts)
      continue
    }
  }

  // report conflicts
  if (urlConflicts.size > 0) {
    for (const [path, routes] of urlConflicts.entries()) {
      // delete all but the first route from the manifest
      for (let i = 1; i < routes.length; i++) {
        delete routeManifest[routes[i].id]
      }
      const files = routes.map((r) => r.file)
      console.error(getRoutePathConflictErrorMessage(path, files))
    }
  }

  return routeManifest
}

/**
 * @param {string} routeId
 */
function getRouteSegments(routeId) {
  /** @type string[] */
  const routeSegments = []

  /** @type string[] */
  const rawRouteSegments = []

  /** @type "NORMAL" | "ESCAPE" | "OPTIONAL" | "OPTIONAL_ESCAPE"  */
  let state = "NORMAL"

  let index = 0
  let routeSegment = ""
  let rawRouteSegment = ""

  while (index < routeId.length) {
    const char = routeId[index]
    index++ //advance to next char
    switch (state) {
      case "NORMAL": {
        if (isSegmentSeparator(char)) {
          pushRouteSegment(routeSegment, rawRouteSegment)
          routeSegment = ""
          rawRouteSegment = ""
          state = "NORMAL"
          break
        }
        if (char === escapeStart) {
          state = "ESCAPE"
          rawRouteSegment += char
          break
        }
        if (char === optionalStart) {
          state = "OPTIONAL"
          rawRouteSegment += char
          break
        }
        if (!routeSegment && char == paramPrefixChar) {
          if (index === routeId.length) {
            routeSegment += "*"
            rawRouteSegment += char
          } else {
            routeSegment += ":"
            rawRouteSegment += char
          }
          break
        }
        routeSegment += char
        rawRouteSegment += char
        break
      }
      case "ESCAPE": {
        if (char === escapeEnd) {
          state = "NORMAL"
          rawRouteSegment += char
          break
        }
        routeSegment += char
        rawRouteSegment += char
        break
      }
      case "OPTIONAL": {
        if (char === optionalEnd) {
          routeSegment += "?"
          rawRouteSegment += char
          state = "NORMAL"
          break
        }
        if (char === escapeStart) {
          state = "OPTIONAL_ESCAPE"
          rawRouteSegment += char
          break
        }
        if (!routeSegment && char === paramPrefixChar) {
          if (index === routeId.length) {
            routeSegment += "*"
            rawRouteSegment += char
          } else {
            routeSegment += ":"
            rawRouteSegment += char
          }
          break
        }
        routeSegment += char
        rawRouteSegment += char
        break
      }
      case "OPTIONAL_ESCAPE": {
        if (char === escapeEnd) {
          state = "OPTIONAL"
          rawRouteSegment += char
          break
        }
        routeSegment += char
        rawRouteSegment += char
        break
      }
    }
  }
  // process remaining segment
  pushRouteSegment(routeSegment, rawRouteSegment)

  if (routeId.endsWith("_index")) {
    routeSegments.pop()
  }

  /** @type string[] */
  const result = []

  for (let index = 0; index < routeSegments.length; index++) {
    const segment = routeSegments[index]
    const rawSegment = rawRouteSegments[index]

    // skip pathless layout segments
    if (
      segment.startsWith("_") &&
      rawSegment.replace(optionalStart, "").startsWith("_") // "_index?" should match "(_[i]ndex)"
    ) {
      continue
    }
    // remove trailing slash
    if (segment.endsWith("_") && rawSegment.endsWith("_")) {
      result.push(segment.slice(0, -1))
    } else {
      result.push(segment)
    }
  }

  return result.length ? result.join("/") : undefined

  /**
   *
   * @param {string} segment
   * @param {string} rawSegment
   * @returns {void}
   */
  function pushRouteSegment(segment, rawSegment) {
    if (!segment) return

    if (rawSegment.includes("*")) {
      return notSupportedInRR(rawSegment, "*")
    }
    if (rawSegment.includes(":")) {
      return notSupportedInRR(rawSegment, ":")
    }
    if (rawSegment.includes("/")) {
      return notSupportedInRR(segment, "/")
    }

    routeSegments.push(segment)
    rawRouteSegments.push(rawSegment)

    function notSupportedInRR(segment, char) {
      throw new Error(
        `Route segment "${segment}" for "${routeId}" cannot contain "${char}".\n` +
          `If this is something you need, upvote this proposal for React Router https://github.com/remix-run/react-router/discussions/9822.`,
      )
    }
  }
}

/**
 * @param {string} pathname
 * @param {string[]} routes
 */
function getRoutePathConflictErrorMessage(pathname, routes) {
  const [taken, ...others] = routes
  if (!pathname.startsWith("/")) {
    pathname = "/" + pathname
  }
  return (
    `⚠️ Route Path Collision: "${pathname}"\n\n` +
    `The following routes all define the same URL, only the first one will be used\n\n` +
    `🟢 ${taken}\n` +
    others.map((route) => `⭕️️ ${route}`).join("\n") +
    "\n"
  )
}

/**
 * @param {string} routeId
 * @param {string[]} files
 */
function getRouteIdConflictErrorMessage(routeId, files) {
  const [taken, ...others] = files
  return (
    `⚠️ Route ID Collision: "${routeId}"\n\n` +
    `The following routes all define the same Route ID, only the first one will be used\n\n` +
    `🟢 ${taken}\n` +
    others.map((route) => `⭕️️ ${route}`).join("\n") +
    "\n"
  )
}
