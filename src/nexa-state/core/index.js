export function createNSManager() {
    const states = [];
    const listeners = [];

    let cursor = 0;

    function startRender() {
        cursor = 0;
    }

    function subscribe(fn) {
        listeners.push(fn);
    }

    function notify() {
        listeners.forEach(fn => fn());
    }

    function createNexaState(initialValue) {
        const index = cursor;

        if (states[index] === undefined) {
            states[index] = initialValue;
        }

        function get() {
            return states[index];
        }

        function set(value) {
            if (typeof value === "function") {
                states[index] = value(states[index]);
            } else {
                states[index] = value;
            }

            notify();
        }

        cursor++;

        return [get, set];
    }

    return {
        startRender,
        createNexaState,
        subscribe,
    };
  }