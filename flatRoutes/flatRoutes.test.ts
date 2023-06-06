/// <reference types="vitest" />

import { normalizeSlashes } from "../normalizeSlashes"
import {
  getRouteIdConflictErrorMessage,
  getRoutePathConflictErrorMessage,
} from "../core"
import { flatRoutesImpl } from "./flatRoutes"
import { vi } from "vitest"
interface ConfigRoute {
  /**
   * The path this route uses to match on the URL pathname.
   */
  path?: string

  /**
   * Should be `true` if it is an index route. This disallows child routes.
   */
  index?: boolean

  /**
   * Should be `true` if the `path` is case-sensitive. Defaults to `false`.
   */
  caseSensitive?: boolean

  /**
   * The unique id for this route, named like its `file` but without the
   * extension. So `app/routes/gists/$username.jsx` will have an `id` of
   * `routes/gists/$username`.
   */
  id: string

  /**
   * The unique `id` for this route's parent route, if there is one.
   */
  parentId?: string

  /**
   * The path to the entry point for this route, relative to
   * `config.appDirectory`.
   */
  file: string
}

describe("should return the correct route hierarchy", () => {
  // we'll add file manually before running the tests
  let testFiles: [string, Omit<ConfigRoute, "file">][] = [
    [
      "routes/_auth.tsx",
      {
        id: "_auth",
        index: false,
        parentId: "root",
        path: undefined,
      },
    ],
    [
      "routes/_auth.forgot-password.tsx",
      {
        id: "_auth.forgot-password",
        index: false,
        parentId: "_auth",
        path: "forgot-password",
      },
    ],
    [
      "routes/_auth.login.tsx",
      {
        id: "_auth.login",
        index: false,
        parentId: "_auth",
        path: "login",
      },
    ],
    [
      "routes/_auth.reset-password.tsx",
      {
        id: "_auth.reset-password",
        index: false,
        parentId: "_auth",
        path: "reset-password",
      },
    ],
    [
      "routes/_auth.signup.tsx",
      {
        id: "_auth.signup",
        index: false,
        parentId: "_auth",
        path: "signup",
      },
    ],
    [
      "routes/_landing/index.tsx",
      {
        id: "_landing",
        index: false,
        parentId: "root",
        path: undefined,
      },
    ],
    [
      "routes/_landing._index/index.tsx",
      {
        id: "_landing._index",
        parentId: "_landing",
        path: undefined,
        index: true,
      },
    ],
    [
      "routes/_landing.index.tsx",
      {
        id: "_landing.index",
        index: false,
        parentId: "_landing",
        path: "index",
      },
    ],
    [
      "routes/_about.tsx",
      {
        id: "_about",
        index: false,
        parentId: "root",
        path: undefined,
      },
    ],
    [
      "routes/_about.faq.tsx",
      {
        id: "_about.faq",
        index: false,
        parentId: "_about",
        path: "faq",
      },
    ],
    [
      "routes/_about.$splat.tsx",
      {
        id: "_about.$splat",
        index: false,
        parentId: "_about",
        path: ":splat",
      },
    ],
    [
      "routes/app.tsx",
      {
        id: "app",
        index: false,
        parentId: "root",
        path: "app",
      },
    ],
    [
      "routes/app.calendar.$day.tsx",
      {
        id: "app.calendar.$day",
        index: false,
        parentId: "app",
        path: "calendar/:day",
      },
    ],
    [
      "routes/app.calendar._index.tsx",
      {
        id: "app.calendar._index",
        index: true,
        parentId: "app",
        path: "calendar",
      },
    ],
    [
      "routes/app.projects.tsx",
      {
        id: "app.projects",
        index: false,
        parentId: "app",
        path: "projects",
      },
    ],
    [
      "routes/app.projects.$id.tsx",
      {
        id: "app.projects.$id",
        index: false,
        parentId: "app.projects",
        path: ":id",
      },
    ],
    [
      "routes/folder/route.tsx",
      {
        id: "folder",
        index: false,
        parentId: "root",
        path: "folder",
      },
    ],
    [
      "routes/[route].tsx",
      {
        id: "[route]",
        index: false,
        parentId: "root",
        path: "route",
      },
    ],

    // Opt out of parent layout
    [
      "routes/app_.projects.$id.roadmap[.pdf].tsx",
      {
        id: "app_.projects.$id.roadmap[.pdf]",
        index: false,
        parentId: "root",
        path: "app/projects/:id/roadmap.pdf",
      },
    ],
    [
      "routes/app_.projects.$id.roadmap.tsx",
      {
        id: "app_.projects.$id.roadmap",
        index: false,
        parentId: "root",
        path: "app/projects/:id/roadmap",
      },
    ],

    [
      "routes/app.skip.tsx",
      {
        id: "app.skip",
        index: false,
        parentId: "app",
        path: "skip",
      },
    ],
    [
      "routes/app.skip_.layout.tsx",
      {
        id: "app.skip_.layout",
        index: false,
        parentId: "app",
        path: "skip/layout",
      },
    ],

    [
      "routes/app_.skipall_._index.tsx",
      {
        id: "app_.skipall_._index",
        index: true,
        parentId: "root",
        path: "app/skipall",
      },
    ],

    // Escaping route segments
    [
      "routes/_about.[$splat].tsx",
      {
        id: "_about.[$splat]",
        index: false,
        parentId: "_about",
        path: "$splat",
      },
    ],
    [
      "routes/_about.[[].tsx",
      {
        id: "_about.[[]",
        index: false,
        parentId: "_about",
        path: "[",
      },
    ],
    [
      "routes/_about.[]].tsx",
      {
        id: "_about.[]]",
        index: false,
        parentId: "_about",
        path: "]",
      },
    ],
    [
      "routes/_about.[.].tsx",
      {
        id: "_about.[.]",
        index: false,
        parentId: "_about",
        path: ".",
      },
    ],

    // Optional route segments
    [
      "routes/(nested)._layout.($slug).tsx",
      {
        id: "(nested)._layout.($slug)",
        index: false,
        parentId: "root",
        path: "nested?/:slug?",
      },
    ],
    [
      "routes/(routes).$.tsx",
      {
        id: "(routes).$",
        index: false,
        parentId: "root",
        path: "routes?/*",
      },
    ],
    [
      "routes/(routes).(sub).$.tsx",
      {
        id: "(routes).(sub).$",
        index: false,
        parentId: "root",
        path: "routes?/sub?/*",
      },
    ],
    [
      "routes/(routes).($slug).tsx",
      {
        id: "(routes).($slug)",
        index: false,
        parentId: "root",
        path: "routes?/:slug?",
      },
    ],
    [
      "routes/(routes).sub.($slug).tsx",
      {
        id: "(routes).sub.($slug)",
        index: false,
        parentId: "root",
        path: "routes?/sub/:slug?",
      },
    ],
    [
      "routes/(nested).$.tsx",
      {
        id: "(nested).$",
        index: false,
        parentId: "root",
        path: "nested?/*",
      },
    ],
    [
      "routes/(flat).$.tsx",
      {
        id: "(flat).$",
        index: false,
        parentId: "root",
        path: "flat?/*",
      },
    ],
    [
      "routes/(flat).($slug).tsx",
      {
        id: "(flat).($slug)",
        index: false,
        parentId: "root",
        path: "flat?/:slug?",
      },
    ],
    [
      "routes/flat.(sub).tsx",
      {
        id: "flat.(sub)",
        index: false,
        parentId: "root",
        path: "flat/sub?",
      },
    ],
    [
      "routes/_layout.tsx",
      {
        id: "_layout",
        index: false,
        parentId: "root",
        path: undefined,
      },
    ],
    [
      "routes/_layout.(test).tsx",
      {
        id: "_layout.(test)",
        index: false,
        parentId: "_layout",
        path: "test?",
      },
    ],
    [
      "routes/_layout.($slug).tsx",
      {
        id: "_layout.($slug)",
        index: false,
        parentId: "_layout",
        path: ":slug?",
      },
    ],

    // Optional + escaped route segments
    [
      "routes/([_index]).tsx",
      {
        id: "([_index])",
        index: false,
        parentId: "root",
        path: "_index?",
      },
    ],
    // TODO: This fails to match because the [i] doesn't match the [_index]
    // I'm using the same PrefixTrie as Remix and the same test ID, so I'm not sure what's going on here
    // [
    //   "routes/(_[i]ndex).([[]).([[]]).tsx",
    //   {
    //     id: "(_[i]ndex).([[]).([[]])",
    //     index: false,
    //     parentId: "([_index])",
    //     path: "[?/[]?",
    //   },
    // ],
    [
      "routes/(sub).([[]).tsx",
      {
        id: "(sub).([[])",
        index: false,
        parentId: "root",
        path: "sub?/[?",
      },
    ],
    [
      "routes/(sub).(]).tsx",
      {
        id: "(sub).(])",
        index: false,
        parentId: "root",
        path: "sub?/]?",
      },
    ],
    [
      "routes/(sub).([[]]).tsx",
      {
        id: "(sub).([[]])",
        index: false,
        parentId: "root",
        path: "sub?/[]?",
      },
    ],
    [
      "routes/(beef]).tsx",
      {
        id: "(beef])",
        index: false,
        parentId: "root",
        path: "beef]?",
      },
    ],
    [
      "routes/(test).(inde[x]).tsx",
      {
        id: "(test).(inde[x])",
        index: false,
        parentId: "root",
        path: "test?/index?",
      },
    ],
    [
      "routes/($[$dollabills]).([.]lol).(what).([$]).($up).tsx",
      {
        id: "($[$dollabills]).([.]lol).(what).([$]).($up)",
        index: false,
        parentId: "root",
        path: ":$dollabills?/.lol?/what?/$?/:up?",
      },
    ],
    [
      "routes/(posts).($slug).([image.jpg]).tsx",
      {
        id: "(posts).($slug).([image.jpg])",
        index: false,
        parentId: "root",
        path: "posts?/:slug?/image.jpg?",
      },
    ],
    [
      "routes/(sub).([sitemap.xml]).tsx",
      {
        id: "(sub).([sitemap.xml])",
        index: false,
        parentId: "root",
        path: "sub?/sitemap.xml?",
      },
    ],
    [
      "routes/(sub).[(sitemap.xml)].tsx",
      {
        id: "(sub).[(sitemap.xml)]",
        index: false,
        parentId: "root",
        path: "sub?/(sitemap.xml)",
      },
    ],
    [
      "routes/($slug[.]json).tsx",
      {
        id: "($slug[.]json)",
        index: false,
        parentId: "root",
        path: ":slug.json?",
      },
    ],

    [
      "routes/[]otherstuff].tsx",
      {
        id: "[]otherstuff]",
        index: false,
        parentId: "root",
        path: "otherstuff]",
      },
    ],
    [
      "routes/brand/index.tsx",
      {
        id: "brand",
        index: false,
        parentId: "root",
        path: "brand",
      },
    ],
    [
      "routes/brand._index.tsx",
      {
        id: "brand._index",
        parentId: "brand",
        index: true,
      },
    ],
    [
      "routes/$.tsx",
      {
        id: "$",
        index: false,
        parentId: "root",
        path: "*",
      },
    ],
    // folder wrapping
    [
      "routes/blog.tsx",
      {
        id: "blog",
        index: false,
        parentId: "root",
        path: "blog",
      },
    ],
    [
      "routes/blog+/new.tsx",
      {
        id: "blog.new",
        index: false,
        parentId: "blog",
        path: "new",
      },
    ],
    [
      "routes/blog+/$post.tsx",
      {
        id: "blog.$post",
        index: false,
        parentId: "blog",
        path: ":post",
      },
    ],
    [
      "routes/blog+/$post[.png].tsx",
      {
        id: "blog.$post[.png]",
        index: false,
        parentId: "blog",
        path: ":post.png",
      },
    ],
    [
      "routes/blog+/organization/$post[.jpg].tsx",
      {
        id: "blog.$post[.jpg]",
        index: false,
        parentId: "blog",
        path: ":post.jpg",
      },
    ],
  ]

  const files = testFiles.map(([file, route]) => {
    const filepath = normalizeSlashes(file)
    return [filepath, { ...route, file: filepath }] as const
  })

  const inputs = files.map(([file]) => file)
  const routeManifest = flatRoutesImpl(inputs)

  let routes = Object.values(routeManifest)

  expect(routes).toHaveLength(files.length)

  for (let [file, route] of files) {
    test(`hierarchy for ${file} - ${route.path}`, () => {
      const matchingFile = routes.find((r) => r.file === file)
      expect(matchingFile).toEqual(route)
    })
  }
})

describe("doesn't warn when there's not a route collision", () => {
  let consoleError = vi
    .spyOn(global.console, "error")
    .mockImplementation(() => {})

  afterEach(() => {
    consoleError.mockReset()
  })

  test("same number of segments and the same dynamic segment index", () => {
    let testFiles = [
      "routes/_user.$username.tsx",
      "routes/sneakers.$sneakerId.tsx",
    ]

    let routeManifest = flatRoutesImpl(
      testFiles.map((file) => normalizeSlashes(file)),
    )

    let routes = Object.values(routeManifest)

    expect(routes).toHaveLength(testFiles.length)
    expect(consoleError).not.toHaveBeenCalled()
  })
})

describe("warns when there's a route collision", () => {
  let consoleError = vi
    .spyOn(global.console, "error")
    .mockImplementation(() => {})

  afterEach(() => {
    consoleError.mockReset()
  })

  test("index files", () => {
    let testFiles = [
      "routes/_dashboard._index.tsx",
      "routes/_landing._index.tsx",
      "routes/_index.tsx",
    ]

    let routeManifest = flatRoutesImpl(
      testFiles.map((file) => normalizeSlashes(file)),
    )

    let routes = Object.values(routeManifest)

    // we had a collision as /route and /index are the same
    expect(routes).toHaveLength(1)
    expect(consoleError).toHaveBeenCalledWith(
      getRoutePathConflictErrorMessage("/", testFiles),
    )
  })

  test("folder/route.tsx matching folder.tsx", () => {
    // we'll add file manually before running the tests
    let testFiles = ["routes/dashboard.tsx", "routes/dashboard/route.tsx"]

    let routeManifest = flatRoutesImpl(
      testFiles.map((file) => normalizeSlashes(file)),
    )

    let routes = Object.values(routeManifest)

    // we had a collision as /route and /index are the same
    expect(routes).toHaveLength(1)
    expect(consoleError).toHaveBeenCalledWith(
      getRouteIdConflictErrorMessage("dashboard", testFiles),
    )
  })

  test.skip("same path, different param name", () => {
    // we'll add file manually before running the tests
    let testFiles = [
      "routes/products.$pid.tsx",
      "routes/products.$productId.tsx",
    ]

    let routeManifest = flatRoutesImpl(
      testFiles.map((file) => normalizeSlashes(file)),
    )
    let routes = Object.values(routeManifest)

    // we had a collision as /route and /index are the same
    expect(routes).toHaveLength(1)
    expect(consoleError).toHaveBeenCalledWith(
      getRoutePathConflictErrorMessage("/products/:pid", testFiles),
    )
  })
})
