/**
* createNexaAPI – Real backend API that forwards all requests to a base URL.
*
* @param {Object} options
* @param {string} options.baseURL – Base URL for all requests
* @param {Object} [options.headers] – Default headers for all requests
* @param {string} [options.credentials] – Default credentials policy
* @returns {Object} API instance with get, post, put, delete, patch, options, fetch, route, invoke
*/
export function createNexaAPI(options = {}) {
  const { baseURL, headers: defaultHeaders = {}, credentials: defaultCredentials } = options;

  if (!baseURL) {
    throw new Error('baseURL is required for createNexaAPI');
  }

  // Named route storage: name -> { method, path, handler (optional) }
  const namedRoutes = new Map();

  // ----------------------------------------------------------------------
  // Core fetch implementation (always goes to real backend)
  // ----------------------------------------------------------------------
  async function performFetch(method, path, requestOptions = {}) {
    const url = new URL(path, baseURL).href;
    const finalHeaders = { ...defaultHeaders, ...(requestOptions.headers || {}) };
    const finalCredentials = requestOptions.credentials || defaultCredentials;

    const fetchOptions = {
      method,
      headers: finalHeaders,
      credentials: finalCredentials,
    };

    if (requestOptions.body) {
      if (typeof requestOptions.body === 'object') {
        fetchOptions.body = JSON.stringify(requestOptions.body);
        if (!fetchOptions.headers['Content-Type']) {
          fetchOptions.headers['Content-Type'] = 'application/json';
        }
      } else {
        fetchOptions.body = requestOptions.body;
      }
    } 
    const response = await fetch(url, fetchOptions);
    return response;
  }

  // ----------------------------------------------------------------------
  // Route registration methods (handlers are ignored – they exist only for interface compatibility)
  // ----------------------------------------------------------------------
  function addRoute(method, path, handler) {
    // In the real API, route handlers are not used for the actual request.
    // They are stored only for named route mapping (if a named route references this path).
    // For simplicity, we do not store them.
    // Named routes are managed separately via api.route.
  }

  const api = {
    get(path, handler) {
      addRoute('GET', path, handler);
      return api;
    },
    post(path, handler) {
      addRoute('POST', path, handler);
      return api;
    },
    put(path, handler) {
      addRoute('PUT', path, handler);
      return api;
    },
    delete(path, handler) {
      addRoute('DELETE', path, handler);
      return api;
    },
    patch(path, handler) {
      addRoute('PATCH', path, handler);
      return api;
    },
    options(path, handler) {
      addRoute('OPTIONS', path, handler);
      return api;
    },

    // Direct fetch replacement – always goes to real backend
    async fetch(path, options = {}) {
      const method = options.method || 'GET';
      return performFetch(method, path, options);
    },

    // Named routes: route[name] = function(configOrHandler)
    route: new Proxy({}, {
      get(target, name) {
        return (configOrHandler) => {
          let method = 'GET';
          let path = `/${name}`;
          let handler = null;

          if (typeof configOrHandler === 'function') {
            handler = configOrHandler;
          } else if (configOrHandler && typeof configOrHandler === 'object') {
            method = configOrHandler.method || method;
            path = configOrHandler.path || path;
            handler = configOrHandler.handler;
          }

          namedRoutes.set(name, { method, path, handler });
        };
      },
    }),

    // Invoke named routes
    invoke: new Proxy({}, {
      get(target, name) {
        return async (options = {}) => {
          const route = namedRoutes.get(name);
          if (!route) {
            throw new Error(`Named route "${name}" not defined`);
          }
          const { method, path: rawPath } = route;

          // Substitute path parameters
          let path = rawPath;
          if (options.params) {
            Object.entries(options.params).forEach(([key, value]) => {
              path = path.replace(`:${key}`, encodeURIComponent(value));
            });
          }

          // Append query string
          const url = new URL(path, baseURL);
          if (options.query) {
            Object.entries(options.query).forEach(([k, v]) => {
              url.searchParams.append(k, v);
            });
          }

          const fetchOptions = {
            method,
            headers: options.headers || {},
            credentials: options.credentials,
            body: options.body,
          };
          return performFetch(method, url.pathname + url.search, fetchOptions);
        };
      },
    }),
  };

  return api;
}