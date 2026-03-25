/**
* createNexaMockAPI – A browser‑only mock API with Express‑like routing,
* delay simulation, random errors, and named routes.
*
* @param {Object} options
* @param {number} [options.delay=0] – Simulated network latency (ms)
* @param {number} [options.errorRate=0] – Probability (0–1) of simulated error
* @param {Object} [options.headers] – Default headers for all responses
* @param {string} [options.credentials] – Default credentials policy
* @returns {Object} API instance with get, post, put, delete, patch, options, fetch, route, invoke
*/
export function createNexaMockAPI(options = {}) {
    const {
        delay = 0,
        errorRate = 0,
        headers: defaultHeaders = {},
        credentials: defaultCredentials,
    } = options;

    // Route storage: key = "METHOD /path/pattern", value = { handler, paramNames }
    const routes = new Map();

    // Named route storage: name -> { method, path, handler }
    const namedRoutes = new Map();

    // ----------------------------------------------------------------------
    // Path matching & parameter extraction
    // ----------------------------------------------------------------------
    function compileRoute(pattern) {
        const paramNames = [];
        const regexStr = pattern
            .replace(/\/:(\w+)/g, (_, param) => {
                paramNames.push(param);
                return '/([^/]+)';
            })
            .replace(/\//g, '\\/');
        const regex = new RegExp(`^${regexStr}$`);
        return { regex, paramNames };
    }

    function matchRoute(method, pathname) {
        for (const [key, { handler, paramNames, regex }] of routes.entries()) {
            const [routeMethod, routePattern] = key.split(' ');
            if (routeMethod !== method) continue;
            const match = pathname.match(regex);
            if (match) {
                const params = {};
                paramNames.forEach((name, i) => {
                    params[name] = match[i + 1];
                });
                return { handler, params };
            }
        }
        return null;
    }

    // ----------------------------------------------------------------------
    // Request & Response objects (Express‑like)
    // ----------------------------------------------------------------------
    function createReq(method, url, body, query, params, headers) {
        return {
            method,
            url,
            body,
            query,
            params,
            headers,
        };
    }

    function createRes() {
        let statusCode = 200;
        const responseHeaders = { ...defaultHeaders };
        let sent = false;
        let data = null;
        let resolveSent;

        const sentPromise = new Promise((resolve) => {
            resolveSent = resolve;
        });

        const res = {
            status(code) {
                statusCode = code;
                return this;
            },
            set(header, value) {
                responseHeaders[header] = value;
                return this;
            },
            send(body) {
                if (sent) return;
                sent = true;
                data = body;
                if (typeof body === 'object' && !responseHeaders['Content-Type']) {
                    responseHeaders['Content-Type'] = 'application/json';
                }
                resolveSent();
            },
            json(body) {
                this.set('Content-Type', 'application/json');
                this.send(body);
            },
            _getStatus() {
                return statusCode;
            },
            _getHeaders() {
                return responseHeaders;
            },
            _getData() {
                return data;
            },
            _sentPromise: sentPromise,
        };
        return res;
    }

    // ----------------------------------------------------------------------
    // Core request handling (delay, error, route execution)
    // ----------------------------------------------------------------------
    async function handleRequest(method, path, requestOptions = {}) {
        // Simulate network delay
        if (delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
        }

        // Random error simulation
        if (errorRate > 0 && Math.random() < errorRate) {
            throw new Error('Simulated network error');
        }

        // Parse URL
        const urlObj = new URL(path, window.location.origin);
        const pathname = urlObj.pathname;
        const query = Object.fromEntries(urlObj.searchParams.entries());

        // Merge default credentials/headers with request options
        const finalHeaders = { ...defaultHeaders, ...(requestOptions.headers || {}) };
        const finalCredentials = requestOptions.credentials || defaultCredentials;

        // Parse body (only if present)
        let body = requestOptions.body;
        if (body && typeof body === 'object' && !(body instanceof FormData)) {
            try {
                body = JSON.parse(JSON.stringify(body));
            } catch (e) {
                // keep as is
            }
        }

        // Find matching route
        const match = matchRoute(method, pathname);
        if (!match) {
            throw new Error(`No mock route found for ${method} ${pathname}`);
        }
        const { handler, params } = match;

        // Build req and res
        const req = createReq(method, path, body, query, params, finalHeaders);
        const res = createRes();

        // Execute handler (could be async)
        let handlerResult;
        try {
            handlerResult = handler(req, res);
            if (handlerResult && typeof handlerResult.then === 'function') {
                await handlerResult;
            }
            await res._sentPromise; // wait until res.send/json is called
        } catch (err) {
            throw err;
        }

        const status = res._getStatus();
        const responseData = res._getData();

        if (status >= 400) {
            const error = new Error(responseData?.message || 'Request failed');
            error.status = status;
            error.data = responseData;
            throw error;
        }

        return new Response(JSON.stringify(responseData));
    }

    // ----------------------------------------------------------------------
    // Route registration methods
    // ----------------------------------------------------------------------
    function addRoute(method, pattern, handler) {
        const { regex, paramNames } = compileRoute(pattern);
        const key = `${method.toUpperCase()} ${pattern}`;
        routes.set(key, { handler, paramNames, regex });
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

        // Direct fetch replacement – uses mock routes
        async fetch(path, options = {}) {
            const method = options.method || 'GET';
            return handleRequest(method, path, options);
        },

        // Named routes: route[name] = function(handlerOrConfig)
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

                    if (!handler) {
                        throw new Error(`Handler required for named route "${name}" in mock mode`);
                    }

                    namedRoutes.set(name, { method, path, handler });
                    // Also register the route so that fetch() can find it
                    addRoute(method, path, handler);
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
                    const url = new URL(path, window.location.origin);
                    if (options.query) {
                        Object.entries(options.query).forEach(([k, v]) => {
                            url.searchParams.append(k, v);
                        });
                    }

                    // Build fetch options
                    const fetchOptions = {
                        method,
                        headers: options.headers || {},
                        credentials: options.credentials,
                    };
                    if (options.body) {
                        if (typeof options.body === 'object') {
                            fetchOptions.body = JSON.stringify(options.body);
                            fetchOptions.headers['Content-Type'] = 'application/json';
                        } else {
                            fetchOptions.body = options.body;
                        }
                    }

                    return api.fetch(url.pathname + url.search, fetchOptions);
                };
            },
        }),
    };

    return api;
}