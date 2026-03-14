// nexa-renderer/diff/patch.js

import { isDifferent } from "./node-compare.js";
import { diffProps } from "./diff-props.js";
import { diffChildren } from "./diff-children.js";
import { createDom } from "../core-utils/create-dom.js";

export function patch(oldVNode, newVNode, container = null) {

    if (isDifferent(oldVNode, newVNode)) {

        const newDom = createDom(newVNode);

        if (container) {
            container.replaceChild(newDom, oldVNode._el);
        } else {
            oldVNode._el.replaceWith(newDom);
        }

        return;
    }

    // Same node type
    const el = oldVNode._el;
    newVNode._el = el;

    if (newVNode.tag === "text") {
        const oldText = oldVNode.children.join("");
        const newText = newVNode.children.join("");

        if (oldText !== newText) {
            el.textContent = newText;
        }
        return;
    }

    diffProps(el, oldVNode, newVNode);
    diffChildren(oldVNode, newVNode);
}