// nexa-renderer/core-utils/apply-props.js

import {
    registerDelegatedEvent,
    removeDelegatedEvent
} from "./event-system.js";

export function applyProps(el, oldProps = {}, newProps = {}) {

    // Remove old props
    for (const key in oldProps) {
        if (!(key in newProps)) {
            if (key.startsWith("on")) {
                removeDelegatedEvent(key.slice(2).toLowerCase(), el);
            } else {
                el.removeAttribute(key);
            }
        }
    }

    // Add / update new props
    for (const key in newProps) {
        const oldVal = oldProps[key];
        const newVal = newProps[key];

        if (oldVal === newVal) continue;

        if (key === "className") {
            el.className = newVal || "";
        }
        else if (key === "style" && typeof newVal === "object") {
            Object.assign(el.style, newVal);
        }
        else if (key.startsWith("on") && typeof newVal === "function") {
            registerDelegatedEvent(key.slice(2).toLowerCase(), el, newVal);
        }
        else {
            el.setAttribute(key, newVal);
        }
    }
}