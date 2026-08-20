import { describe, it, expect } from "vitest";
import { resolveDateRange } from "./date-range";

// Fixed reference point: Wednesday 2026-08-19, 15:30.
const NOW = new Date(2026, 7, 19, 15, 30);

describe("resolveDateRange", () => {
  it("returns no bounds for 'todos' or an unset preset", () => {
    expect(resolveDateRange("todos", undefined, undefined, NOW)).toEqual({ desde: null, hasta: null });
    expect(resolveDateRange(undefined, undefined, undefined, NOW)).toEqual({ desde: null, hasta: null });
  });

  it("bounds 'hoy' to the start and end of the reference day", () => {
    const { desde, hasta } = resolveDateRange("hoy", undefined, undefined, NOW);
    expect(desde).toBe(new Date(2026, 7, 19, 0, 0, 0, 0).toISOString());
    expect(hasta).toBe(new Date(2026, 7, 19, 23, 59, 59, 999).toISOString());
  });

  it("bounds 'semana' to Monday through the reference day", () => {
    const { desde, hasta } = resolveDateRange("semana", undefined, undefined, NOW);
    expect(desde).toBe(new Date(2026, 7, 17, 0, 0, 0, 0).toISOString()); // Monday 2026-08-17
    expect(hasta).toBe(new Date(2026, 7, 19, 23, 59, 59, 999).toISOString());
  });

  it("bounds 'mes' to the 1st through the reference day", () => {
    const { desde, hasta } = resolveDateRange("mes", undefined, undefined, NOW);
    expect(desde).toBe(new Date(2026, 7, 1, 0, 0, 0, 0).toISOString());
    expect(hasta).toBe(new Date(2026, 7, 19, 23, 59, 59, 999).toISOString());
  });

  it("uses the given desde/hasta for 'personalizado', open-ended if one side is missing", () => {
    expect(resolveDateRange("personalizado", "2026-08-01", "2026-08-10", NOW)).toEqual({
      desde: new Date(2026, 7, 1, 0, 0, 0, 0).toISOString(),
      hasta: new Date(2026, 7, 10, 23, 59, 59, 999).toISOString(),
    });
    expect(resolveDateRange("personalizado", "2026-08-01", undefined, NOW)).toEqual({
      desde: new Date(2026, 7, 1, 0, 0, 0, 0).toISOString(),
      hasta: null,
    });
  });
});
