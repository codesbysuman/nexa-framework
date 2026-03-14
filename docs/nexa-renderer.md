# File: index.js

## Functions

### createNexaRenderer
- **Description:** Creates a new renderer instance for rendering and patching virtual DOM nodes to a real DOM container.
- **Parameters:** None
- **Returns:**  
  `object` – An object containing the following methods:
  - `setView(real_dom)`
  - `renderND(vnode)`
  - `_rerender()` (internal hook for future state integration)

## Returned Object Methods

### setView
- **Description:** Sets the real DOM container where the virtual DOM will be rendered.
- **Parameters:**
  - `real_dom` (`HTMLElement`, optional, default `document.body`): The DOM element to serve as the root container.
- **Returns:** `undefined`
- **Throws:** Error if the provided argument is not an instance of `HTMLElement`.

### renderND
- **Description:** Renders a virtual DOM node into the root container. Handles both initial mount (creates DOM) and subsequent updates (patches differences).
- **Parameters:**
  - `vnode` (`object`): The virtual DOM node to render.
- **Returns:** `undefined`
- **Throws:** Error if `setView()` has not been called first.

### _rerender
- **Description:** Internal method for future state integration. Re-renders using the stored root template and props.
- **Parameters:** None
- **Returns:** `undefined`

## Internal Properties

- `rootContainer` (`HTMLElement | null`): Stores the real DOM container.
- `oldVNode` (`object | null`): Stores the previous virtual DOM tree for diffing.
- `rootTemplate` (`function | null`): Stores the root template function for future state support.
- `rootProps` (`object | null`): Stores the root props for future state support.

---

# File: tags.js

## Functions

### createNexaDomTags
- **Description:** Creates an object containing functions for all HTML and JSX-style nodes (tags) defined in the imported `htmlAndJsNodes` array. Each function returns a virtual DOM node object.
- **Parameters:** None
- **Returns:**  
  `object` – An object where each key is a lowercase tag name and each value is a function that creates a virtual DOM node for that tag.
- **Throws:** Error if `htmlAndJsNodes` is not a non-empty array.

## Returned Object Methods

Each tag function follows this signature:

### [tagName]
- **Description:** Creates a virtual DOM node for the specified HTML element or special node type (text, fragment, doctype, comment, cdata, placeholder).
- **Parameters:**
  - `first` (`any`, optional): Either props object or the first child.
  - `...rest` (`any[]`, optional): Additional children.
- **Returns:**  
  `object` – A virtual DOM node with the structure:
    - `tag` (`string`): The tag name (lowercase).
    - `prop` (`object | null`): Props/attributes for the element.
    - `children` (`array`): Array of child virtual DOM nodes.

## Internal Functions

### specialHandlers
- **Description:** Object containing handler functions for special node types.

#### text
- **Description:** Creates a text node virtual DOM element.
- **Parameters:**
  - `content` (`any`): The text content.
- **Returns:** `object` – Virtual DOM node with tag `"text"`.

#### fragment
- **Description:** Creates a fragment node that can contain multiple children without a parent DOM element.
- **Parameters:**
  - `first` (`any`, optional): Either props object or the first child.
  - `...rest` (`any[]`, optional): Additional children.
- **Returns:** `object` – Virtual DOM node with tag `"fragment"`.

#### doctype
- **Description:** Creates a document type node.
- **Returns:** `object` – Virtual DOM node with tag `"doctype"`.

#### comment
- **Description:** Creates a comment node.
- **Parameters:**
  - `content` (`any`): The comment content.
- **Returns:** `object` – Virtual DOM node with tag `"comment"`.

#### cdata
- **Description:** Creates a CDATA section node.
- **Parameters:**
  - `content` (`any`): The CDATA content.
- **Returns:** `object` – Virtual DOM node with tag `"cdata"`.

#### placeholder
- **Description:** Creates a placeholder marker for dynamic content insertion.
- **Parameters:**
  - `id` (`string`): The placeholder identifier key.
- **Returns:** `object` – A placeholder object with `isPlaceholder: true` and the provided key.

### createTagFunction
- **Description:** Factory function that creates a tag function for a given tag name.
- **Parameters:**
  - `tagName` (`string`): The name of the tag.
- **Returns:** `function` – A function that creates virtual DOM nodes for the specified tag.

### isProps
- **Description:** Determines if a value is a props object (not a tag node and not a placeholder).
- **Parameters:**
  - `val` (`any`): The value to check.
- **Returns:** `boolean` – `true` if the value is a props object, `false` otherwise.

---

# File: template-compiler.js

## Functions

### compileNexaTemplate
- **Description:** Compiles a static Nexa virtual DOM blueprint into a hardcoded template function string. Supports placeholders, text nodes, fragments, and nested structures.
- **Parameters:**
  - `blueprint` (`object`): The static virtual DOM tree to compile.
  - `functionName` (`string`, optional, default `"CompiledTemplate"`): The name for the generated template function.
- **Returns:**  
  `string` – A JavaScript function string that, when evaluated, returns a template function accepting a context object.
- **Throws:** Error if the blueprint is invalid.

## Internal Functions

### compileNode
- **Description:** Recursively compiles a single node into a JavaScript code string.
- **Parameters:**
  - `node` (`object | null`): The virtual DOM node to compile.
- **Returns:** `string` – JavaScript code representing the node.

## Compiled Template Output

The generated function has the following structure:

```javascript
/**
 * 🔥 Auto-generated Nexa Compiled Template
 * Function: [functionName]
 * Generated by Nexa Template Compiler
 */

export function [functionName](ctx = {}) {
    return [compiled node tree];
}

## Placeholder Resolution

Placeholders in the blueprint (`{ isPlaceholder: true, key: "keyName" }`) are compiled to code that:

- Reads `ctx.keyName` at runtime
- Returns an empty text node if the value is `null` or `undefined`
- Returns a cloned VNode if the value is an object with a `tag` property
- Returns a fragment with mapped children if the value is an array
- Returns a text node with stringified value for all other types

---

# File: template.js

## Functions

### createNexaTemplate
- **Description:** Creates a template function from a static blueprint that can resolve placeholders with runtime context values.
- **Parameters:**
  - `blueprint` (`object`, optional, default `{}`): The static virtual DOM tree to use as the template structure.
- **Returns:**  
  `function` – A template function that accepts a context object and returns a resolved virtual DOM tree.

## Returned Function

### template
- **Description:** Resolves the blueprint with the provided context, replacing placeholders with actual values.
- **Parameters:**
  - `ctx` (`object`, optional, default `{}`): The context object containing values for placeholders.
- **Returns:**  
  `object` – A fully resolved virtual DOM tree with all placeholders replaced.

## Internal Functions

### resolveNode
- **Description:** Recursively resolves a node by replacing placeholders with context values and cloning static nodes.
- **Parameters:**
  - `node` (`object | null`): The virtual DOM node to resolve.
  - `ctx` (`object`): The context object containing placeholder values.
- **Returns:** `object | null` – The resolved virtual DOM node.

## Placeholder Resolution Rules

When a placeholder node (`{ isPlaceholder: true, key: "keyName" }`) is encountered:

1. **Value is `null` or `undefined`** – Returns an empty text node: `{ tag: "text", prop: null, children: [""] }`
2. **Value is a VNode (has `tag` property)** – Returns a cloned copy of the VNode
3. **Value is an array** – Returns a fragment node with each array element mapped to a VNode
4. **All other values** – Returns a text node with the stringified value