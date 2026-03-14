# File: index.js

## Functions

### createNexaFetcher
- **Description:** Creates a new fetcher instance with its own configuration and route registry. Returns an object with methods to configure and make API calls.
- **Parameters:** None
- **Returns:**  
  `object` – An object containing the following methods:
  - `setRoute(name, config)`
  - `setProduction(value)`
  - `setConfig(config)`
  - `call(name, opts)`

## Returned Object Methods

### setRoute
- **Description:** Registers an API route with a unique name and configuration.
- **Parameters:**
  - `name` (`string`): Unique identifier for the route.
  - `config` (`object`): Route configuration. Expected properties:
    - `method` (`string`, optional): HTTP method (default `"GET"`).
    - `url` (`string` or `function`): Endpoint URL. If a function, it receives parameters from `opts.params` and must return a string.
    - `headers` (`object`, optional): Additional headers for this route.
    - `mock` (`function`, optional): Async function that returns mock data when `production` is `false`.
    - `credentials` (`string`, optional): Override global credentials.
    - `baseURL` (`string`, optional): Override global base URL.
    - `options` (`object`, optional): Additional fetch options.
- **Returns:** `undefined`

### setProduction
- **Description:** Sets the production mode. When `true`, mock responses are disabled.
- **Parameters:**
  - `value` (`boolean`): If truthy, enables production mode; if falsy, disables it.
- **Returns:** `undefined`

### setConfig
- **Description:** Merges the provided configuration into the global fetcher settings.
- **Parameters:**
  - `config` (`object`): Global configuration to merge. Possible properties:
    - `baseURL` (`string`, optional): Base URL prepended to all request URLs.
    - `headers` (`object`, optional): Default headers for all requests.
    - `credentials` (`string`, optional): Default credentials policy (e.g., `'include'`, `'same-origin'`).
- **Returns:** `undefined`

### call
- **Description:** Makes an API call to a previously registered route. Handles mocks (if not in production) and wraps errors.
- **Parameters:**
  - `name` (`string`): The name of the registered route.
  - `opts` (`object`, optional): Override options for this specific call. Supported properties:
    - `method` (`string`, optional): HTTP method override.
    - `params` (`array`, optional): Parameters passed to a dynamic `url` function.
    - `body` (`object`, optional): Request body (will be JSON`stringified`).
    - `headers` (`object`, optional): Additional headers merged with route and global headers.
    - `credentials` (`string`, optional): Override credentials.
    - `baseURL` (`string`, optional): Override base URL.
    - `options` (`object`, optional): Additional fetch options.
- **Returns:**  
  `Promise<any | { error: any }>` – Resolves with the response data on success, or with an object `{ error }` if the request fails (network error or HTTP error).

## Internal Functions

### _fetchRaw
- **Description:** Low`level fetch wrapper that merges global configuration, handles JSON parsing, and normalises errors.
- **Parameters:**
  - `url` (`string`): The endpoint URL (appended to the base URL).
  - `options` (`object`, optional): Fetch options, possibly including `baseURL`, `headers`, `credentials`, and any other `fetch` parameters.
- **Returns:**  
  `Promise<any>` – Parsed JSON response. Throws an error object (or parsed error JSON) on HTTP failure.

### _call
- **Description:** Internal method that retrieves the route configuration, handles mock mode, constructs the final URL, merges options, and invokes `_fetchRaw`.
- **Parameters:**
  - `name` (`string`): Registered route name.
  - `opts` (`object`, optional): Same options as the public `call` method.
- **Returns:**  
  `Promise<any>` – Raw data from `_fetchRaw`. Throws on error.

---

# File: mock-network.js

## Functions

### mockNetwork
- **Description:** Simulates a network request with configurable success rate and timeout. Useful for mocking API responses in development.
- **Parameters:**
  - `options` (`object`): Configuration object.
    - `onSuccessData` (`any`, optional, default `{}`): The data to resolve with when the mock succeeds.
    - `thresholds` (`object`, optional, default `{}`): Thresholds for the mock.
      - `successRate` (`number`, optional): Probability of success between 0 and 1. If omitted, the mock always succeeds.
      - `timeout` (`number`, optional): Delay in milliseconds before resolving or rejecting. If omitted, the delay is effectively 0 (scheduled immediately).
- **Returns:**  
  `Promise<any>` – Resolves with `onSuccessData` on success, or rejects with `{ status: "500" }` on failure.