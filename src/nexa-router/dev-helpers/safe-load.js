// Wrap route handlers
export function createSafeLoader(errorPageFn) {
  return (routeHandler) => {
    return async (ctx) => {
      try {
        await routeHandler(ctx);
      } catch (error) {
        // Show error page instead of crashing
        errorPageFn?.({ ...ctx, error })
      }
    };
  }
}