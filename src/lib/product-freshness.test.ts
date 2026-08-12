import { describe, it, expect, vi, afterEach } from "vitest";
import { isRecentlyCreated } from "./product-freshness";

describe("isRecentlyCreated", () => {
  afterEach(() => vi.useRealTimers());

  it("is true for a timestamp within the last 15 days", () => {
    vi.useFakeTimers().setSystemTime(new Date("2026-08-12T00:00:00Z"));
    const fiveDaysAgo = new Date("2026-08-07T00:00:00Z").toISOString();
    expect(isRecentlyCreated(fiveDaysAgo)).toBe(true);
  });

  it("is false for a timestamp older than 15 days", () => {
    vi.useFakeTimers().setSystemTime(new Date("2026-08-12T00:00:00Z"));
    const twentyDaysAgo = new Date("2026-07-23T00:00:00Z").toISOString();
    expect(isRecentlyCreated(twentyDaysAgo)).toBe(false);
  });
});
