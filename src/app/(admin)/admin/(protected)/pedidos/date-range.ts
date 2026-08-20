export type RangoPreset = "todos" | "hoy" | "semana" | "mes" | "personalizado";

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function endOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(23, 59, 59, 999);
  return c;
}

// desde/hasta come in as "YYYY-MM-DD" from <input type="date">.
export function resolveDateRange(
  rango: string | undefined,
  desde: string | undefined,
  hasta: string | undefined,
  now: Date = new Date()
): { desde: string | null; hasta: string | null } {
  switch (rango) {
    case "hoy":
      return { desde: startOfDay(now).toISOString(), hasta: endOfDay(now).toISOString() };
    case "semana": {
      const diffToMonday = (now.getDay() + 6) % 7;
      const start = startOfDay(now);
      start.setDate(start.getDate() - diffToMonday);
      return { desde: start.toISOString(), hasta: endOfDay(now).toISOString() };
    }
    case "mes": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { desde: startOfDay(start).toISOString(), hasta: endOfDay(now).toISOString() };
    }
    case "personalizado":
      return {
        desde: desde ? startOfDay(new Date(`${desde}T00:00:00`)).toISOString() : null,
        hasta: hasta ? endOfDay(new Date(`${hasta}T00:00:00`)).toISOString() : null,
      };
    default:
      return { desde: null, hasta: null };
  }
}
