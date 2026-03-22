// createNexaMockAPI.js
import {
    normalizeRequest,
    buildUrl,
    createMatcher,
    parseBody,
    parseQuery,
    simulateNetwork,
    createResponseHelper,
    validateRoute,
    globalMockInstances
} from '../utils/index.js';

/**
* Creates a mock API client that intercepts requests and returns mock responses.
* @param {object} config
* @param {object} [config.db] - In-memory database.
* @param {number} [config.defaultDelay=0] - Default delay (ms) for responses.
* @param {number} [config.errorRate=0] - Default error rate (0-1) for simulated errors.
* @param {Function} [config.responseWrapper] - Wraps response data (default: { success: true, data }).
* @param {string} [config.baseURL=''] - Base URL for route matching.
* @returns {object} API instance
*/
export function createNexaMockAPI(config = {}) {
    const routes = [];
    const namedRoutes = new Map();
    let db = config.db || {};
    const defaultDelay = config.defaultDelay || 0;
    const defaultErrorRate = config.errorRate || 0;
    const responseWrapper = config.responseWrapper || (data => ({ success: true, data }));
    const baseURL = config.baseURL || '';

    // Helper: find a matching mock route (uses linear search, but could be optimized)
    function matchMockRoute(method, url) {
        // Extract path without query
        const pathname = url.split('?')[0];
        for (const route of routes) {
            const match = route.matcher({ method, url: pathname });
            if (match) return { route, params: match.params };
        }
        return null;
    }

    // Mock request handler
    async function handleMockRequest(request) {
        const match = matchMockRoute(request.method, request.url);
        if (!match) throw new Error('NoMockRouteError');

        const { route, params } = match;
        const routeOptions = route.options || {};
        await simulateNetwork({
            delay: routeOptions.delay !== undefined ? routeOptions.delay : defaultDelay,
            errorRate: routeOptions.errorRate !== undefined ? routeOptions.errorRate : defaultErrorRate,
            timeout: routeOptions.timeout,
            signal: request.signal
        });

        // Build enhanced request object for handler
        const enhancedReq = {
            ...request,
            params,
            query: parseQuery(request.url),
            body: await parseBody(request),
            db: () => db, // Expose db as function for immutability
        };

        const res = createResponseHelper(responseWrapper);
        let handlerResult;
        try {
            handlerResult = await route.handler(enhancedReq, res);
        } catch (err) {
            // If error has status, use it, otherwise 500
            const status = err.status || 500;
            const message = err.message || 'Internal Server Error';
            return new Response(JSON.stringify({ error: message }), { status });
        }
        return res.build(handlerResult);
    }

    async function dispatchRequest(input, init) {
        const request = normalizeRequest(input, init);
        return handleMockRequest(request);
    }

    const instance = {
        get(path, handler, options) { return instance.route(null, 'GET', path, handler, options); },
        post(path, handler, options) { return instance.route(null, 'POST', path, handler, options); },
        put(path, handler, options) { return instance.route(null, 'PUT', path, handler, options); },
        delete(path, handler, options) { return instance.route(null, 'DELETE', path, handler, options); },
        patch(path, handler, options) { return instance.route(null, 'PATCH', path, handler, options); },
        any(path, handler, options) { return instance.route(null, '*', path, handler, options); },

        route(name, method, path, handler, options = {}) {
            validateRoute(method, path, handler);
            const fullPath = baseURL + path;
            const matcher = createMatcher(fullPath, method);
            const routeObj = { method: method.toUpperCase(), path: fullPath, handler, options, matcher };
            routes.push(routeObj);
            if (name) namedRoutes.set(name, routeObj);
            return instance;
        },

        async fetch(input, init) {
            return dispatchRequest(input, init);
        },

        async invoke(name, params = {}) {
            const route = namedRoutes.get(name);
            if (!route) throw new Error(`Route "${name}" not found`);
            const url = buildUrl(route.path, params);
            const requestInit = {
                method: route.method,
                headers: params.headers || {},
                body: params.body !== undefined ? params.body : undefined,
                signal: params.signal,
            };
            // If body is an object, stringify only if Content-Type not set
            if (requestInit.body && typeof requestInit.body === 'object' && !requestInit.headers['Content-Type']) {
                requestInit.body = JSON.stringify(requestInit.body);
                requestInit.headers['Content-Type'] = 'application/json';
            }
            const request = normalizeRequest(url, requestInit);
            return handleMockRequest(request);
        },

        setMode(newMode) {
            if (newMode !== 'mock') throw new Error('createNexaMockAPI only supports "mock" mode');
        },
        getMode() { return 'mock'; },

        setDb(newDb) { db = newDb; },
        getDb() { return db; },

        reset(resetDb = true) {
            routes.length = 0;
            namedRoutes.clear();
            if (resetDb) db = config.db || {};
        },

        destroy() {
            globalMockInstances.delete(instance);
        }
    };

    if (typeof window !== 'undefined') {
        globalMockInstances.add(instance);
        window.__nexaMockInstances = globalMockInstances;
    }

    return instance;
}