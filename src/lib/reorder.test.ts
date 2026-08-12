import { describe, it, expect } from "vitest";
import { computeNewOrder } from "./reorder";

describe("computeNewOrder", () => {
  it("moves an item from the start to the end", () => {
    expect(computeNewOrder(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
  });

  it("moves an item from the end to the start", () => {
    expect(computeNewOrder(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });

  it("moves an item one position over", () => {
    expect(computeNewOrder(["a", "b", "c"], 0, 1)).toEqual(["b", "a", "c"]);
  });

  it("does nothing when fromIndex equals toIndex", () => {
    expect(computeNewOrder(["a", "b", "c"], 1, 1)).toEqual(["a", "b", "c"]);
  });

  it("handles a single-item list", () => {
    expect(computeNewOrder(["a"], 0, 0)).toEqual(["a"]);
  });
});
