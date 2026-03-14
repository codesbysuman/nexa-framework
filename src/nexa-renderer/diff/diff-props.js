import { applyProps } from "../core-utils/apply-props.js";

export function diffProps(el, oldVNode, newVNode){
    applyProps(el, oldVNode.prop || {}, newVNode.prop || {});
}