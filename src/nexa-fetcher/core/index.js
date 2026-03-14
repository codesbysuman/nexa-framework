export function createNexaFetcher() {
    const registry = new Map();
    let production = false;

    let globalConfig = {
        baseURL: "",
        headers: {},
        credentials: undefined
    };

    function setRoute(name, config) {
        registry.set(name, config);
    }

    function setProduction(value) {
        production = !!value;
    }

    function setConfig(config) {
        globalConfig = { ...globalConfig, ...config };
    }

    async function _fetchRaw(url, options = {}) {
        const merged = {
            headers: {
                "Content-Type": "application/json",
                ...globalConfig.headers,
                ...options.headers
            },
            credentials: options.credentials ?? globalConfig.credentials,
            ...options
        };

        if (merged.headers["Content-Type"] === undefined) {
            delete merged.headers["Content-Type"];
        }

        const res = await fetch((options.baseURL ?? globalConfig.baseURL) + url, merged);

        if (!res.ok) {
            let error;
            try {
                error = await res.json();
            } catch {
                error = { status: res.status, message: res.statusText };
            }
            throw error;
        }

        return res.json();
    }

    async function _call(name, opts = {}) {
        const api = registry.get(name);
        if (!api) throw new Error(`API "${name}" not defined`);

        // ---- MOCK MODE ----
        if (!production && api.mock) {
            return await api.mock(...(opts.params || []));
        }

        // dynamic URL
        const url =
            typeof api.url === "function"
                ? api.url(...(opts.params || []))
                : api.url;

        // final merged options
        const finalOpts = {
            method: opts.method ?? api.method ?? "GET",
            body: opts.body ? JSON.stringify(opts.body) : undefined,
            headers: {
                ...api.headers,
                ...opts.headers
            },
            credentials: opts.credentials ?? api.credentials ?? globalConfig.credentials,
            ...api.options,
            ...opts.options,
            baseURL: opts.baseURL ?? api.baseURL ?? globalConfig.baseURL
        };

        return _fetchRaw(url, finalOpts);
    }

    async function call(name, opts = {}) {
        try {
            const data = await _call(name, opts); // derive existing call
            return data;
        } catch (error) {
            return { error };
        }
    }

    return {
        setRoute,
        setProduction,
        setConfig,
        call
    };
}