// nexa-renderer/diff/node-compare.js

export function isDifferent(a, b){
    return !a || !b || a.tag !== b.tag;
}