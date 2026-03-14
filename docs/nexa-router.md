# File: index.js

## Functions

### createNexaRouter
- **Description:** Creates a new router instance for handling client-side routing with support for dynamic parameters, wildcards, regular expressions, and route prioritization.
- **Parameters:** None
- **Returns:**  
  `object` – An object containing the following methods:
  - `setRoute(path, handler)`
  - `navigate(path, replace)`
  - `onNavigate(handler)`
  - `setProduction(value)`

## Returned Object Methods

### setRoute
- **Description:** Registers a route with a path pattern and a handler function. The path can be a string (with Express-style parameters), a `RegExp`, an array of strings, or `"*"` for a wildcard fallback.
- **Parameters:**
  - `path` (`string` | `RegExp` | `Array<string>` | `"*"`): The route pattern. For string paths, parameters are defined with `:paramName` and optional custom regex patterns with `:paramName(regex)`. Use `"*"` for a wildcard route that matches any unmatched path.
  - `handler` (`function`): An async function that receives a context object with `path`, `params`, `query`, and `onDestroy(fn)`.
- **Returns:** `undefined`
- **Throws:** Error if the handler is not a function, if a duplicate string route is added, or if more than one wildcard route is registered.

### navigate
- **Description:** Navigates to a given path, matches the appropriate route, and executes its handler. Updates the browser history.
- **Parameters:**
  - `path` (`string`): The destination URL (absolute or relative).
  - `replace` (`boolean`, optional, default `false`): If `true`, replaces the current history entry instead of pushing a new one.
- **Returns:** `Promise<void>`

### onNavigate
- **Description:** Sets a global handler that is called before every navigation. Can be used for analytics, authentication checks, etc.
- **Parameters:**
  - `handler` (`function`): An async function to execute before navigation.
- **Returns:** `Promise<void>`

### setProduction
- **Description:** Enables or disables production mode. In production, some error checks (like `onDestroy` parameter validation) are skipped.
- **Parameters:**
  - `value` (`boolean`): If truthy, production mode is enabled.
- **Returns:** `undefined`

## Internal Functions

### normalizePath
- **Description:** Ensures a path starts with a slash and removes trailing slash (except for root).
- **Parameters:**
  - `path` (`string`): The path to normalize.
- **Returns:** `string` – The normalized path.

### parseQuery
- **Description:** Parses the query string of a URL into an object.
- **Parameters:**
  - `search` (`string`): The search string (e.g., `"?a=1&b=2"`).
- **Returns:** `object` – Key-value pairs of query parameters.

### compileRoute
- **Description:** Converts a route path (string or RegExp) into a compiled object with a regular expression, extracted parameter names, and a specificity score used for matching priority.
- **Parameters:**
  - `path` (`string` | `RegExp`): The route pattern.
- **Returns:** `object` – Contains:
  - `regex` (`RegExp`): The regular expression to test paths.
  - `keys` (`Array<string>`): Extracted parameter names.
  - `isRegex` (`boolean`): `true` if the path was a RegExp.
  - `isStatic` (`boolean`): `true` if the route has no parameters.
  - `isWildcard` (`boolean`): `true` if the route contains a `*` wildcard.
  - `hasOptional` (`boolean`): `true` if the pattern includes optional segments.
  - `hasParameters` (`boolean`): `true` if the route has any parameters.
  - `segmentCount` (`number`): Number of path segments.
  - `staticSegmentCount` (`number`): Number of static (non-parameter) segments.
  - `specificity` (`number`): A score for route prioritization.
  - `index` (`number`): Registration order.

### matchRoute
- **Description:** Finds the best matching route for a given pathname based on specificity, segment count, and registration order.
- **Parameters:**
  - `pathname` (`string`): The normalized path to match.
- **Returns:** `object | null` – If a match is found, returns an object with:
  - `handler` (`function`): The route handler.
  - `params` (`object`): Extracted parameter values.
  - `isRegex` (`boolean`): Whether the matched route was a RegExp.
  Otherwise returns `null`.

---

# File: intercept-links.js

## Functions

### interceptLinks
- **Description:** Attaches click event listeners to specified targets to intercept clicks on links with a `data-link` attribute, preventing default navigation and delegating to the provided router.
- **Parameters:**
  - `targets` (`Array<EventTarget>`, optional, default `[document]`): An array of DOM elements or documents to attach the click listener to.
  - `router` (`object`): A router instance that exposes a `navigate` method (typically returned by `createNexaRouter`).
- **Returns:**  
  `boolean` – `false` if `targets` is not a non-empty array, otherwise `undefined` (the function adds event listeners as a side effect).

---

# File: lazy-load.js

## Functions

### lazyLoad
- **Description:** Wraps a dynamic import function to create a route handler that lazily loads a page module and executes its default export as the route handler.
- **Parameters:**
  - `importFn` (`function`): A function that returns a `Promise` resolving to a module (e.g., `() => import('./page.js')`).
- **Returns:**  
  `function` – An async route handler that receives a context object, loads the module, and calls `module.default(ctx)`.

---

# File: route-error-handler.js

## Functions

### withRouteErrorHandling
- **Description:** Wraps a route handler with error handling. If the original handler throws, the error is logged and a fallback page function is called with the context extended by an `error` property.
- **Parameters:**
  - `routeHandler` (`function`): The original route handler to wrap.
  - `pageFn` (`function`, optional): A fallback page function that receives the context (with `error`) to render an error page.
- **Returns:**  
  `function` – An async function that takes a context object, attempts to call `routeHandler`, and catches any errors to invoke `pageFn`.