export function lazyLoad(importFn) {
    return async (ctx) => {
        const mod = await importFn();
        await mod.default(ctx);
    }
}