import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

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
}));
