// nexa-renderer/core-utils/event-system.js

const eventHandlers = new Map();

export function registerDelegatedEvent(eventType, element, handler) {
    if (!eventHandlers.has(eventType)) {
        eventHandlers.set(eventType, new Map());
        document.body.addEventListener(eventType, delegatedEventHandler);
    }

    eventHandlers.get(eventType).set(element, handler);
}

export function removeDelegatedEvent(eventType, element) {
    const handlers = eventHandlers.get(eventType);
    if (!handlers) return;

    handlers.delete(element);
}

function delegatedEventHandler(e) {
    const eventType = e.type;
    const handlers = eventHandlers.get(eventType);
    if (!handlers) return;

    let target = e.target;

    while (target && target !== document.body) {
        if (handlers.has(target)) {
            handlers.get(target).call(target, e);
            if (e.cancelBubble) break;
        }
        target = target.parentNode;
    }
}