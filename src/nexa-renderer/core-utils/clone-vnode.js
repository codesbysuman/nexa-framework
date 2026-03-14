export function cloneVNode(node) {
    if (!node || typeof node !== "object") return node;

    return {
        tag: node.tag,
        prop: node.prop ? { ...node.prop } : null,
        children: node.children
            ? node.children.map(child => cloneVNode(child))
            : []
    };
}