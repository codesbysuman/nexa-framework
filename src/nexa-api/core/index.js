// createNexaAPI.js
import {
  normalizeRequest,
  buildUrl,
  validateRoute,
  globalRealInstances
} from '../utils/index.js';

/**
* Creates a real API client that performs actual HTTP requests.
* @param {object} config
* @param {string} [config.baseURL] - Base URL for all requests.
* @param {object} [config.db] - Placeholder for compatibility (not used).
* @returns {object} API instance
*/
export function createNexaAPI(config = {}) {
  const routes = [];
  const namedRoutes = new Map();
  let db = config.db || {};
  const baseURL = config.baseURL || '';

  // Real request handler
  async function handleRealRequest(input, init) {
    let url = input;
    if (typeof input === 'string') {
      if (!input.startsWith('http')) {
        url = baseURL + input;
      }
    } else if (input instanceof Request) {
      url = input.url;
    }
    return fetch(url, init);
  }

  // Core dispatcher
  async function dispatchRequest(input, init) {
    const request = normalizeRequest(input, init);
    return handleRealRequest(request.url, { ...init, signal: request.signal });
  }

  const instance = {
    // Route definition (stores metadata only)
    get(path, handler, options) { return instance.route(null, 'GET', path, handler, options); },
    post(path, handler, options) { return instance.route(null, 'POST', path, handler, options); },
    put(path, handler, options) { return instance.route(null, 'PUT', path, handler, options); },
    delete(path, handler, options) { return instance.route(null, 'DELETE', path, handler, options); },
    patch(path, handler, options) { return instance.route(null, 'PATCH', path, handler, options); },
    any(path, handler, options) { return instance.route(null, '*', path, handler, options); },

    route(name, method, path, handler, options = {}) {
      validateRoute(method, path, handler);
      const fullPath = baseURL + path;
      const routeObj = { method: method.toUpperCase(), path: fullPath, handler, options };
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
        body: params.body !== undefined ? params.body : undefined
      };
      // If body is an object, stringify only if Content-Type not set
      if (requestInit.body && typeof requestInit.body === 'object' && !requestInit.headers['Content-Type']) {
        requestInit.body = JSON.stringify(requestInit.body);
        requestInit.headers['Content-Type'] = 'application/json';
      }
      return handleRealRequest(url, requestInit);
    },

    setMode(newMode) {
      if (newMode !== 'real') throw new Error('createNexaAPI only supports "real" mode');
    },
    getMode() { return 'real'; },

    setDb(newDb) { db = newDb; },
    getDb() { return db; },

    reset(resetDb = true) {
      routes.length = 0;
      namedRoutes.clear();
      if (resetDb) db = config.db || {};
    },

    destroy() {
      globalRealInstances.delete(instance);
    }
  };

  if (typeof window !== 'undefined') {
    globalRealInstances.add(instance);
    window.__nexaRealInstances = globalRealInstances;
  }

  return instance;
}