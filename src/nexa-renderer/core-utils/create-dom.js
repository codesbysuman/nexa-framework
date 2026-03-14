// nexa-renderer/core-utils/create-dom.js

import { applyProps } from "./apply-props.js";

export function createDom(vnode) {
    if (!vnode || typeof vnode !== "object") {
        const textNode = document.createTextNode("");
        return textNode;
    }

    const { tag, prop, children } = vnode;

    if (tag === "text") {
        const textNode = document.createTextNode(children.join(""));
        vnode._el = textNode;
        return textNode;
    }

    if (tag === "fragment") {
        const frag = document.createDocumentFragment();
        children.forEach(child => {
            frag.appendChild(createDom(child));
        });
        vnode._el = frag;
        return frag;
    }

    const el = document.createElement(tag);
    vnode._el = el;

    applyProps(el, {}, prop);

    children.forEach(child => {
        el.appendChild(createDom(child));
    });

    return el;
}