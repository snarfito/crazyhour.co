import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("renders the given message", () => {
    render(<EmptyState message="Estamos armando el catálogo — vuelve pronto." />);
    expect(screen.getByText("Estamos armando el catálogo — vuelve pronto.")).toBeInTheDocument();
  });
});
