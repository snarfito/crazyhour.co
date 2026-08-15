import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuantityStepper } from "./quantity-stepper";

describe("QuantityStepper", () => {
  it("shows the current quantity and calls onChange on +/-", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<QuantityStepper quantity={3} onChange={onChange} />);

    expect(screen.getByLabelText("Cantidad")).toHaveValue(3);

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

  it("commits a typed quantity (e.g. a bulk order of 50) on blur", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<QuantityStepper quantity={1} onChange={onChange} />);

    const input = screen.getByLabelText("Cantidad");
    await user.clear(input);
    await user.type(input, "50");
    await user.tab();

    expect(onChange).toHaveBeenCalledWith(50);
  });

  it("commits a typed quantity on Enter and clamps below-min values to min", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<QuantityStepper quantity={5} onChange={onChange} min={2} />);

    const input = screen.getByLabelText("Cantidad");
    await user.clear(input);
    await user.type(input, "0{Enter}");

    expect(onChange).toHaveBeenCalledWith(2);
  });
});
