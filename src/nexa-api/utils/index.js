// nexa-core.js - shared logic for both real and mock APIs

/**
* Normalizes fetch input and init into a consistent request object.
* @param {string|Request} input
* @param {object} init
* @returns {{ method: string, url: string, headers: Headers, body: any, signal?: AbortSignal }}
*/
export function normalizeRequest(input, init = {}) {
    let url, method = init.method || 'GET', headers = init.headers || {}, body = init.body;
    let signal = init.signal;

    if (typeof input === 'string') {
        url = input;
    } else if (input instanceof Request) {
        url = input.url;
        method = input.method;
        headers = input.headers;
        body = input.body;
        signal = input.signal;
    } else if (input && typeof input === 'object') {
        // Support for URL objects
        url = input.toString();
    }

    // Convert headers to Headers object for consistency
    if (!(headers instanceof Headers)) {
        headers = new Headers(headers);
    }

    return { method: method.toUpperCase(), url, headers, body, signal };
}

/**
* Builds a URL with path parameters and query string.
* @param {string} basePath - Base path (may include :param placeholders)
* @param {object} params - { params: {}, query: {} }
* @returns {string}
*/
export function buildUrl(basePath, { params = {}, query = {} } = {}) {
    let url = basePath;
    for (const [key, value] of Object.entries(params)) {
        url = url.replace(`:${key}`, encodeURIComponent(value));
    }
    if (query && Object.keys(query).length) {
        const searchParams = new URLSearchParams(query);
        const queryString = searchParams.toString();
        if (queryString) url += (url.includes('?') ? '&' : '?') + queryString;
    }
    return url;
}

/**
* Creates a route matcher using path-to-regexp (or a simple regex fallback).
* @param {string} pathPattern
* @param {string} method
* @returns {function}
*/
export function createMatcher(pathPattern, method) {
    // Use path-to-regexp if available, otherwise fallback to regex
    // For simplicity, we'll use a simple regex matcher (as original)
    const paramNames = [];
    const regexStr = pathPattern.replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
        paramNames.push(name);
        return '([^/]+)';
    });
    const regex = new RegExp(`^${regexStr}$`);
    return (request) => {
        if (method !== '*' && request.method !== method) return null;
        // Strip query string for path matching
        const pathname = request.url.split('?')[0];
        const match = pathname.match(regex);
        if (!match) return null;
        const params = {};
        paramNames.forEach((name, idx) => { params[name] = match[idx + 1]; });
        return { params };
    };
}

/**
* Parses request body based on Content-Type header.
* @param {object} req - The request object (with headers and body)
* @returns {Promise<any>}
*/
export async function parseBody(req) {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        return req.json();
    }
    if (contentType.includes('application/x-www-form-urlencoded')) {
        const text = await req.text();
        return Object.fromEntries(new URLSearchParams(text));
    }
    // For other types, return raw body (blob, formdata, etc.)
    return req.body;
}

/**
* Extracts query parameters from a URL.
* @param {string} url
* @returns {object}
*/
export function parseQuery(url) {
    const query = {};
    const searchParams = new URLSearchParams(url.split('?')[1] || '');
    for (const [key, value] of searchParams) {
        query[key] = value;
    }
    return query;
}

/**
* Simulates network conditions (delay, error rate, timeout).
* @param {object} options - { delay, errorRate, timeout, signal }
* @returns {Promise<void>}
*/
export async function simulateNetwork(options = {}) {
    const { delay = 0, errorRate = 0, timeout, signal } = options;

    if (delay > 0) {
        await new Promise((resolve, reject) => {
            const timer = setTimeout(resolve, delay);
            if (signal) {
                signal.addEventListener('abort', () => {
                    clearTimeout(timer);
                    reject(new Error('Request aborted'));
                });
            }
        });
    }

    if (Math.random() < errorRate) {
        throw new Error('Simulated network error');
    }

    if (timeout) {
        // timeout is not directly supported, but we can implement a promise race
        await Promise.race([
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout)),
            Promise.resolve()
        ]);
    }
}

/**
* Creates a response helper (for mock mode).
* @param {Function} responseWrapper - global wrapper function
* @returns {object} ResponseHelper instance
*/
export function createResponseHelper(responseWrapper) {
    class ResponseHelper {
        constructor() {
            this.status = 200;
            this.headers = {};
            this.body = null;
            this.wrapped = false;
        }
        status(code) { this.status = code; return this; }
        setHeader(name, value) { this.headers[name] = value; return this; }
        json(data) { this.body = data; this.setHeader('Content-Type', 'application/json'); return this; }
        send(data) { this.body = data; return this; }
        redirect(url, status = 302) {
            this.status = status;
            this.setHeader('Location', url);
            return this;
        }
        error(message, status = 500) {
            this.status = status;
            this.json({ error: message });
            return this;
        }
        build(handlerResult) {
            // If handler returns a Response directly, use it
            if (handlerResult instanceof Response) return handlerResult;
            const finalData = handlerResult !== undefined ? handlerResult : this.body;
            const wrappedData = responseWrapper(finalData);
            return new Response(JSON.stringify(wrappedData), {
                status: this.status,
                headers: this.headers
            });
        }
    }
    return new ResponseHelper();
}

/**
* Validate route definition.
* @param {string} method
* @param {string} path
* @param {Function} handler
* @throws {Error}
*/
export function validateRoute(method, path, handler) {
    if (typeof handler !== 'function') {
        throw new Error('Route handler must be a function');
    }
    if (typeof path !== 'string') {
        throw new Error('Route path must be a string');
    }
    if (typeof method !== 'string' && method !== null) {
        throw new Error('Method must be a string or null');
    }
}

/**
* Global instance tracking (use WeakSet to avoid memory leaks)
*/
export const globalMockInstances = (typeof window !== 'undefined' && window.__nexaMockInstances) ?
    window.__nexaMockInstances : new Set();
export const globalRealInstances = (typeof window !== 'undefined' && window.__nexaRealInstances) ?
    window.__nexaRealInstances : new Set();

if (typeof window !== 'undefined') {
    if (!window.__nexaMockInstances) window.__nexaMockInstances = new Set();
    if (!window.__nexaRealInstances) window.__nexaRealInstances = new Set();
}