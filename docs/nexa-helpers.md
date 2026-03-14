# File: index.js

## Functions

### deepLog
- **Description:** Re‑exported from `./deep-log.js`. Logs a value recursively with configurable depth and formatting.
- **Parameters:** See `deepLog` in `deep-log.js`.
- **Returns:** See `deepLog` in `deep-log.js`.

### getCurrentFullPath
- **Description:** Re‑exported from `./full-url-path.js`. Returns the current URL path including the query string.
- **Parameters:** None
- **Returns:** `string` – The current `pathname + search` of the browser location.

---

# File: full-url-path.js

## Functions

### getCurrentFullPath
- **Description:** Returns the full current URL path including the query string (e.g., `/products?page=2`).
- **Parameters:** None
- **Returns:**  
  `string` – `window.location.pathname + window.location.search`.

---

# File: deep-log.js

## Functions

### deepLog
- **Description:** Recursively inspects a value (object, array, function, etc.) and logs a formatted representation to the console. Handles circular references and respects depth limits.
- **Parameters:**
  - `value` (`any`): The value to inspect and log.
  - `options` (`object`, optional): Configuration object.
    - `depth` (`number`, optional, default `Infinity`): Maximum recursion depth.
    - `showFunctions` (`boolean`, optional, default `true`): If `true`, functions are shown as their source code; otherwise replaced with `'[Function]'`.
    - `indent` (`number`, optional, default `2`): Number of spaces used for indentation in the JSON output.
- **Returns:**  
  `string` – The formatted output that was also logged to the console.

## Internal Functions

### serialize
- **Description:** Recursively serializes a value, handling circular references and depth limits.
- **Parameters:**
  - `val` (`any`): The value to serialize.
  - `level` (`number`): Current recursion depth.
- **Returns:** `any` – A serialized representation (primitive, array, object, or special marker strings like `'[Circular]'`).