import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HowItWorks } from "./how-it-works";

describe("HowItWorks", () => {
  it("renders the 3 steps with the dual-checkout copy", () => {
    render(<HowItWorks />);

    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("Miras el catálogo")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText("Pagas como prefieres")).toBeInTheDocument();
    expect(
      screen.getByText(/paga en línea con Wompi, o escríbenos por WhatsApp/i)
    ).toBeInTheDocument();
    expect(screen.getByText("03")).toBeInTheDocument();
    expect(screen.getByText("Recoges o te lo enviamos")).toBeInTheDocument();
  });
});
