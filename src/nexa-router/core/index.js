export function createNexaRouter() {
    // ================== INTERNAL STATE ==================
    let isProduction = false;
    let currentCleanup = null;
    const routes = [];
    let wildcardRoute = null;
    let routeIndexCounter = 0; // To track registration order for tie-breaking
    let base = "";

    // ================== HELPERS ==================
    const normalizePath = (path) => {
        if (typeof path === 'string') {
            if (!path.startsWith("/")) path = "/" + path;
            if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
        }
        return path;
    };

    const parseQuery = (search) =>
        Object.fromEntries(new URLSearchParams(search));

    // Enhanced compileRoute with better scoring
    const compileRoute = (path) => {
        // Handle regular expression patterns
        if (path instanceof RegExp) {
            return {
                regex: path,
                keys: [],
                isRegex: true,
                isStatic: false,
                isWildcard: false,
                hasOptional: false,
                hasParameters: false,
                segmentCount: 0,
                specificity: 0, // Lowest priority for RegExp
                index: routeIndexCounter++
            };
        }

        const keys = [];
        let pattern = '';
        let inParam = false;
        let paramName = '';
        let paramPattern = '';
        let i = 0;
        let segmentCount = 0;
        let hasOptional = false;
        let hasParameters = false;
        let isWildcard = false;
        let isStatic = true;
        let staticSegmentCount = 0;

        // Calculate segment count and check for static segments
        const segments = path.split('/').filter(s => s);
        segmentCount = segments.length;

        // Count static segments
        for (const seg of segments) {
            if (!seg.includes(':') && !seg.includes('*') && !seg.includes('+') &&
                !seg.includes('?') && !seg.includes('(') && !seg.includes(')')) {
                staticSegmentCount++;
            }
        }

        // Convert Express pattern to regex pattern
        while (i < path.length) {
            const char = path[i];

            if (char === ':') {
                // Start of a parameter
                isStatic = false;
                hasParameters = true;
                inParam = true;
                paramName = '';
                paramPattern = '';
                i++;

                // Extract parameter name
                while (i < path.length && /[A-Za-z0-9_]/.test(path[i])) {
                    paramName += path[i];
                    i++;
                }

                // Check for custom regex pattern in parentheses
                if (i < path.length && path[i] === '(') {
                    i++;
                    let parenCount = 1;
                    while (i < path.length && parenCount > 0) {
                        if (path[i] === '(') parenCount++;
                        else if (path[i] === ')') parenCount--;
                        if (parenCount > 0) paramPattern += path[i];
                        i++;
                    }
                } else {
                    paramPattern = '[^\\/]+'; // Default pattern for parameters
                }

                if (paramName) {
                    keys.push(paramName);
                    pattern += `(${paramPattern})`;
                }
                inParam = false;
                continue;
            }

            // Handle special characters
            if ('()[]?+.*^${}|\\'.includes(char)) {
                pattern += '\\' + char;
            } else if (char === '?') {
                // Make previous character/group optional
                hasOptional = true;
                pattern += '?';
            } else if (char === '*') {
                // Wildcard (matches anything, including slashes)
                isWildcard = true;
                pattern += '.*';
            } else if (char === '+') {
                // One or more of previous character
                pattern += '+';
            } else {
                pattern += char;
            }

            i++;
        }

        // Calculate specificity score:
        // Higher score = higher priority
        let specificity = 0;

        if (isStatic) {
            // Static routes get highest priority
            specificity = 100000 + segmentCount * 1000;
        } else {
            // Base score based on static segment count
            specificity = staticSegmentCount * 1000;

            // Penalties (lower specificity for less specific routes)
            if (hasParameters) specificity -= 500;
            if (hasOptional) specificity -= 200;
            if (isWildcard) specificity -= 1000; // Wildcards get big penalty

            // Bonus for more specific patterns
            specificity += (segmentCount - staticSegmentCount) * 100;
        }

        return {
            regex: new RegExp(`^${pattern}$`),
            keys,
            isRegex: false,
            isStatic,
            isWildcard,
            hasOptional,
            hasParameters,
            segmentCount,
            staticSegmentCount,
            specificity,
            index: routeIndexCounter++
        };
    };

    // ================== MATCH ==================
    const matchRoute = (pathname) => {
        // Get all matching routes
        const matchingRoutes = [];

        for (const route of routes) {
            const match = pathname.match(route.regex);
            if (match) {
                const params = {};
                if (route.keys.length > 0) {
                    route.keys.forEach((k, idx) => {
                        if (match[idx + 1] !== undefined) {
                            params[k] = match[idx + 1];
                        }
                    });
                }

                matchingRoutes.push({
                    route,
                    params,
                    match
                });
            }
        }

        // Sort matching routes by priority
        matchingRoutes.sort((a, b) => {
            // First by specificity (higher is better)
            if (a.route.specificity !== b.route.specificity) {
                return b.route.specificity - a.route.specificity;
            }

            // Then by segment count (more segments = more specific)
            if (a.route.segmentCount !== b.route.segmentCount) {
                return b.route.segmentCount - a.route.segmentCount;
            }

            // Then by static segment count
            if (a.route.staticSegmentCount !== b.route.staticSegmentCount) {
                return b.route.staticSegmentCount - a.route.staticSegmentCount;
            }

            // Finally by registration order (earlier = better)
            return a.route.index - b.route.index;
        });

        // Return the best match
        if (matchingRoutes.length > 0) {
            const bestMatch = matchingRoutes[0];
            return {
                handler: bestMatch.route.handler,
                params: bestMatch.params,
                isRegex: bestMatch.route.isRegex
            };
        }

        if (wildcardRoute) {
            return {
                handler: wildcardRoute,
                params: {},
                isRegex: false
            };
        }

        return null;
    };

    // ================== NAVIGATION ==================
    const navigate = async (path, replace = false) => {
        await onNavigate?.();
        const url = new URL(path, location.origin);
        let pathname = normalizePath(url.pathname);
        
        if(base && pathname.startsWith(base)){
            pathname = normalizePath(pathname.slice(base.length))
        }
        const match = matchRoute(pathname);
        if (!match) return;

        if (replace) history.replaceState({}, "", path);
        else history.pushState({}, "", path);

        if (currentCleanup) {
            await currentCleanup();
            currentCleanup = null;
        }

        const context = {
            path: pathname,
            params: match.params,
            query: parseQuery(url.search),
            onDestroy(fn) {
                if (typeof fn !== "function") {
                    if(!isProduction) throw new Error("onDestroy expects a function");
                    return;
                }
                currentCleanup = fn;
            }
        };

        try {
            const result = await match.handler(context);
            if (typeof result === "function") {
                await result(context);
            }
        } catch (error) {
            if(!isProduction) console.error('[Nexa] Page Fn error:', error); 
        }

    };

    // ================== ROUTE REGISTRATION ==================
    const setRoute = (path, handler) => {
        if (typeof handler !== "function") {
            throw new Error("NexaRouter: route handler must be a function");
        }

        // Handle array of paths
        if (Array.isArray(path)) {
            path.forEach(p => setRoute(p, handler));
            return;
        }

        if (path === "*") {
            if (wildcardRoute) {
                throw new Error("NexaRouter: only one wildcard route allowed");
            }
            wildcardRoute = handler;
            return;
        }

        // Handle RegExp directly
        let isRegex = false;
        if (path instanceof RegExp) {
            isRegex = true;
        } else if (typeof path === 'string') {
            path = normalizePath(path);
        }

        // Check for duplicates (for string paths only)
        if (!isRegex) {
            if (routes.some(r => !r.isRegex && r.path === path)) {
                throw new Error(`NexaRouter: duplicate route "${path}"`);
            }
        }

        const compiled = compileRoute(path);

        routes.push({
            path,
            handler,
            ...compiled
        });

        // Sort routes initially for better organization
        routes.sort((a, b) => {
            if (a.specificity !== b.specificity) {
                return b.specificity - a.specificity;
            }
            return a.index - b.index;
        });
    };

    const setProduction = (value) => {
        isProduction = !!value;
    }

    const setBase = (value) => {
        base = normalizePath(value);
    }

    const onNavigate = async (handler) => {
        await handler?.();
    }

    // ================== PUBLIC API ==================
    return {
        setRoute,
        setBase,
        navigate,
        onNavigate,
        setProduction
    };
}