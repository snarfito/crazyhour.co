import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("shadcn Button", () => {
  it("renders its children as a button", () => {
    render(<Button>Pagar con Wompi</Button>);
    expect(screen.getByRole("button", { name: "Pagar con Wompi" })).toBeInTheDocument();
  });
});
