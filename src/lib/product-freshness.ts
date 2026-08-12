const NEW_PRODUCT_WINDOW_MS = 15 * 24 * 60 * 60 * 1000;

export function isRecentlyCreated(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < NEW_PRODUCT_WINDOW_MS;
}
