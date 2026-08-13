export const DEFAULT_ENHANCE_PROMPT =
  "Mejora esta foto de producto para catálogo de piñatería: corrige el balance de color y la iluminación, limpia y uniformiza el fondo. Elimina cualquier texto, precio o marca de agua superpuesto en la imagen original. Conserva el producto y sus proporciones reales — no lo redibujes ni cambies su forma o color.";

export function buildCoverPrompt(categoryName: string): string {
  return `Genera una imagen de portada cuadrada para la categoría "${categoryName}" de una tienda de piñatería y artículos de fiesta: ilustración vibrante y colorida, sin texto ni marcas de agua, estilo consistente con catálogo de e-commerce.`;
}
