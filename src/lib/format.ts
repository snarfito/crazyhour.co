export function formatCOP(cop: number): string {
  const formatted = new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(cop);
  return `$ ${formatted}`;
}
