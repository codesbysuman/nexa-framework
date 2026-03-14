export function deepLog(value, options = {}) {
    const {
        depth = Infinity,
        showFunctions = true,
        indent = 2
    } = options;

    const seen = new WeakSet();

    function serialize(val, level) {
        if (level > depth) return '[Max Depth Reached]';

        // Primitive values
        if (
            val === null ||
            typeof val !== 'object' &&
            typeof val !== 'function'
        ) {
            return val;
        }

        // Circular reference check
        if (typeof val === 'object' || typeof val === 'function') {
            if (seen.has(val)) return '[Circular]';
            seen.add(val);
        }

        // Function
        if (typeof val === 'function') {
            return showFunctions ? val.toString() : '[Function]';
        }

        // Array
        if (Array.isArray(val)) {
            return val.map(v => serialize(v, level + 1));
        }

        // Object
        const obj = {};
        for (const key in val) {
            try {
                obj[key] = serialize(val[key], level + 1);
            } catch {
                obj[key] = '[Unserializable]';
            }
        }
        return obj;
    }

    const output = serialize(value, 0);
    const finalOutput =
        typeof output === 'string'
            ? output
            : JSON.stringify(output, null, indent)
        ;
    console.log(finalOutput);
    return finalOutput;
}