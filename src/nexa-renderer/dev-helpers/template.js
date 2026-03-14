import { cloneVNode } from "../core-utils/clone-vnode.js";

export function createNexaTemplate(blueprint = {}) {
    if (typeof blueprint !== "object") {
        console.warn(`Expected nexa dom object, received ${typeof blueprint}`);
        return;
    }

    function resolveNode(node, ctx) {
        if (!node) return null;

        // Placeholder handling
        if (node.isPlaceholder) {
            const value = ctx[node.key];

            if (value == null) {
                return { tag: "text", prop: null, children: [""] };
            }

            // If value is already a Nexa VNode
            if (typeof value === "object" && value.tag) {
                return cloneVNode(value);
            }

            // If array (multiple children)
            if (Array.isArray(value)) {
                return {
                    tag: "fragment",
                    prop: null,
                    children: value.map(v =>
                        typeof v === "object" && v.tag
                            ? v
                            : { tag: "text", prop: null, children: [String(v)] }
                    )
                };
            }

            // Primitive fallback
            return {
                tag: "text",
                prop: null,
                children: [String(value)]
            };
        }

        // Text node clone
        if (node.tag === "text") {
            return {
                tag: "text",
                prop: node.prop,
                children: [...node.children]
            };
        }

        // Normal element clone
        return {
            tag: node.tag,
            prop: node.prop ? { ...node.prop } : null,
            children: node.children
                ? node.children.map(child => resolveNode(child, ctx))
                : []
        };
    }

    return function template(ctx = {}) {
        return resolveNode(blueprint, ctx);
    };
}