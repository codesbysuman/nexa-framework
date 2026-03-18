import { htmlAndJsNodes } from "../core-utils/tags-list.js";

export function createNexaTags() {
    const nexaDomTags = {};


    // Validate input array
    if (!Array.isArray(htmlAndJsNodes) || htmlAndJsNodes.length === 0) {
        throw new Error('htmlAndJsNodes must be a non-empty array');
    }

    // Special handlers for certain node types
    const specialHandlers = {
        // Text node
        text(content) {
            try {
                if (content === null || content === undefined) {
                    return { tag: 'text', prop: null, children: [] };
                }
                if (typeof content === 'string' || typeof content === 'number' || typeof content === 'boolean') {
                    return { tag: 'text', prop: null, children: [String(content)] };
                }
                if (content instanceof Date) {
                    return { tag: 'text', prop: null, children: [content.toString()] };
                }
                if (content && typeof content === 'object' && content.tag) {
                    console.warn('Text handler received a node, returning as-is');
                    return content;
                }
                return { tag: 'text', prop: null, children: [String(content)] };
            } catch (error) {
                console.error('Error in text handler:', error);
                return { tag: 'text', prop: null, children: [] };
            }
        },

        // Fragment
        fragment(first, ...rest) {
            try {
                const hasProps = isProps(first);;
                const actualProps = hasProps ? first : null;
                const rawChildren = hasProps ? rest : (first === undefined ? [] : [first, ...rest]);

                const processedChildren = rawChildren
                    .filter(child => child != null)
                    .flat(Infinity)
                    .map(child => {
                        if (child && typeof child === 'object' && child.tag) return child;
                        return { tag: 'text', prop: null, children: [String(child)] };
                    });

                return { tag: 'fragment', prop: actualProps, children: processedChildren };
            } catch (error) {
                console.error('Error in fragment handler:', error);
                return { tag: 'fragment', prop: null, children: [] };
            }
        },

        // Document type
        doctype() { ({ tag: 'doctype', prop: null, children: [] }) },

        // Comment
        comment(content) {
            try {
                return { tag: 'comment', prop: null, children: [content ? String(content) : ''] };
            } catch (error) {
                console.error('Error in comment handler:', error);
                return { tag: 'comment', prop: null, children: [''] };
            }
        },

        // CDATA
        cdata(content) {
            try {
                return { tag: 'cdata', prop: null, children: [content ? String(content) : ''] };
            } catch (error) {
                console.error('Error in cdata handler:', error);
                return { tag: 'cdata', prop: null, children: [''] };
            }
        }
    };

    function isProps(val) {
        return typeof val === "object" && !val?.tag && !val.isPlaceholder;
    }
    // Generic tag function creator
    const createTagFunction = (tagName) => {
        return function (first, ...rest) {
            try {

                if (typeof tagName !== 'string') throw new Error('Invalid tag name');

                const hasProps = isProps(first);
                const actualProps = hasProps ? first : null;

                const rawChildren = hasProps ? rest : (first === undefined ? [] : [first, ...rest]);

                const processedChildren = rawChildren
                    .filter(child => child !== null && child !== undefined)
                    .flat(Infinity)
                    .map(child => {
                        if (child && (typeof child === 'object' && child.tag) || child?.isPlaceholder) return child;
                        if (typeof child === 'string' || typeof child === 'number' || typeof child === 'boolean') {
                            return { tag: 'text', prop: null, children: [String(child)] };
                        }
                        if (child instanceof Date) {
                            return { tag: 'text', prop: null, children: [child.toString()] };
                        }
                        if (child && typeof child === 'object') {
                            console.warn(`Invalid child in <${tagName}>: converting object to string`, child);
                            return { tag: 'text', prop: null, children: [JSON.stringify(child)] };
                        }
                        return { tag: 'text', prop: null, children: [String(child)] };
                    });

                return {
                    tag: tagName.toLowerCase(),
                    prop: actualProps,
                    children: processedChildren
                };
            } catch (error) {
                console.error(`Error creating <${tagName}> element:`, error);
                return { tag: tagName ? tagName.toLowerCase() : 'error', prop: null, children: [] };
            }
        };
    };

    // Attach all functions
    htmlAndJsNodes.forEach(nodeName => {
        try {
            if (typeof nodeName !== 'string') return;
            let functionName = nodeName.toLocaleLowerCase();
            if (specialHandlers[nodeName]) {
                const originalHandler = specialHandlers[nodeName];
                nexaDomTags[functionName] = function (...args) {
                    try {
                        return originalHandler(...args);
                    } catch (error) {
                        console.error(`Error in special handler ${functionName}:`, error);
                        return { tag: nodeName, prop: null, children: [] };
                    }
                };
            } else {
                nexaDomTags[functionName] = createTagFunction(nodeName);
            }

            // Make function non-enumerable (optional)
            Object.defineProperty(nexaDomTags, functionName, {
                value: nexaDomTags[functionName],
                writable: true,
                enumerable: false,
                configurable: true
            });
        } catch (error) {
            console.error(`Failed to create function for node: ${nodeName}`, error);
        }
    });

    return nexaDomTags;
}