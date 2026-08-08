import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuantityStepper } from "./quantity-stepper";

describe("QuantityStepper", () => {
  it("shows the current quantity and calls onChange on +/-", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<QuantityStepper quantity={3} onChange={onChange} />);

    expect(screen.getByText("3")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Sumar"));
    expect(onChange).toHaveBeenCalledWith(4);

    await user.click(screen.getByLabelText("Restar"));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("does not go below min (default 1)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<QuantityStepper quantity={1} onChange={onChange} />);

    await user.click(screen.getByLabelText("Restar"));
    expect(onChange).toHaveBeenCalledWith(1);
  });
});
