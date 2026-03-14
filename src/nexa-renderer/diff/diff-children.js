// nexa-renderer/diff/diff-children.js

import { patch } from "./patch.js";
import { createDom } from "../core-utils/create-dom.js";

export function diffChildren(oldVNode, newVNode) {

    const el = oldVNode._el;

    const oldChildren = oldVNode.children || [];
    const newChildren = newVNode.children || [];

    const max = Math.max(oldChildren.length, newChildren.length);

    for (let i = 0; i < max; i++) {

        const oldChild = oldChildren[i];
        const newChild = newChildren[i];

        if (!oldChild && newChild) {
            el.appendChild(createDom(newChild));
        }
        else if (oldChild && !newChild) {
            el.removeChild(oldChild._el);
        }
        else if (oldChild && newChild) {
            patch(oldChild, newChild);
        }
    }
}