import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// jsdom doesn't implement scrollIntoView at all — stub it so components that
// scroll a selected element into view (e.g. the product gallery thumbnails)
// don't crash under test.
Element.prototype.scrollIntoView = vi.fn();

// Mock next/font/google to avoid errors in test environment
vi.mock("next/font/google", () => ({
  Nunito: vi.fn((config) => ({
    variable: config.variable,
    className: "nunito",
  })),
  Manrope: vi.fn((config) => ({
    variable: config.variable,
    className: "manrope",
  })),
  Caveat: vi.fn((config) => ({
    variable: config.variable,
    className: "caveat",
  })),
  JetBrains_Mono: vi.fn((config) => ({
    variable: config.variable,
    className: "jetbrains-mono",
  })),
}));
