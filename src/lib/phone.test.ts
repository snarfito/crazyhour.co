import { describe, it, expect } from "vitest";
import { isValidCOPhone } from "./phone";

describe("isValidCOPhone", () => {
  it("accepts a 10-digit Colombian mobile number", () => {
    expect(isValidCOPhone("3001234567")).toBe(true);
  });

  it("accepts the same number with spaces/dashes and a +57 prefix", () => {
    expect(isValidCOPhone("+57 300 123 4567")).toBe(true);
    expect(isValidCOPhone("57-300-123-4567")).toBe(true);
  });

  it("rejects a number that doesn't start with 3", () => {
    expect(isValidCOPhone("2001234567")).toBe(false);
  });

  it("rejects numbers with the wrong length", () => {
    expect(isValidCOPhone("300123456")).toBe(false);
    expect(isValidCOPhone("30012345678")).toBe(false);
  });

  it("rejects non-digit characters", () => {
    expect(isValidCOPhone("300abc4567")).toBe(false);
  });

  it("rejects empty input", () => {
    expect(isValidCOPhone("")).toBe(false);
  });
});
