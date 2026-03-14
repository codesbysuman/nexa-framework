// nexa-renderer/core/index.js

import { createDom } from "../core-utils/create-dom.js";
import { patch } from "../diff/patch.js";

export function createNexaRenderer() {
    let rootContainer;
    let oldVNode = null;

    function setView(real_dom = document.body) {
        if (!(real_dom instanceof HTMLElement)) {
            throw new Error(`View expected HTMLElement received ${typeof real_dom}`);
        }
        rootContainer = real_dom;
    }

    function renderND(vnode) {
        if (!rootContainer) {
            throw new Error("Renderer view not set. Call setView() first.");
        }

        // Initial mount
        if (!oldVNode) {
            const dom = createDom(vnode);
            rootContainer.innerHTML = "";
            rootContainer.appendChild(dom);
        } else {
            patch(oldVNode, vnode, rootContainer);
        }

        oldVNode = vnode;
    }

    return {
        setView,
        renderND,
    };
}