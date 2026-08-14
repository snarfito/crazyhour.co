import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditableCell } from "./editable-cell";

const mockUpdateProductField = vi.fn().mockResolvedValue(undefined);
vi.mock("./actions", () => ({
  updateProductField: (...args: unknown[]) => mockUpdateProductField(...args),
}));

describe("EditableCell", () => {
  beforeEach(() => {
    mockUpdateProductField.mockReset().mockResolvedValue(undefined);
  });

  it("renders the initial value", () => {
    render(<EditableCell productId="p-1" field="name" value="Piñata estrella" />);
    expect(screen.getByRole("textbox")).toHaveValue("Piñata estrella");
  });

  it("saves the new value on blur when it changed", async () => {
    const user = userEvent.setup();
    render(<EditableCell productId="p-1" field="name" value="Piñata estrella" />);

    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "Piñata gigante");
    await user.tab();

    expect(mockUpdateProductField).toHaveBeenCalledWith("p-1", "name", "Piñata gigante");
  });

  it("does not save on blur when the value did not change", async () => {
    const user = userEvent.setup();
    render(<EditableCell productId="p-1" field="name" value="Piñata estrella" />);

    await user.click(screen.getByRole("textbox"));
    await user.tab();

    expect(mockUpdateProductField).not.toHaveBeenCalled();
  });

  it("shows a brief saved indicator after a successful save", async () => {
    const user = userEvent.setup();
    render(<EditableCell productId="p-1" field="name" value="Piñata estrella" />);

    const input = screen.getByRole("textbox");
    await user.type(input, " grande");
    await user.tab();

    expect(await screen.findByLabelText("Guardado")).toBeInTheDocument();
  });

  it("reverts the value and shows an inline error when the save fails", async () => {
    mockUpdateProductField.mockRejectedValueOnce(new Error("El precio por unidad no puede quedar vacío."));
    const user = userEvent.setup();
    render(<EditableCell productId="p-1" field="unit_price_cop" value={20000} type="number" required />);

    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.tab();

    expect(await screen.findByText("El precio por unidad no puede quedar vacío.")).toBeInTheDocument();
    expect(input).toHaveValue(20000);
  });

  it("does not save redundantly after a successful edit, then focus/blur with no change", async () => {
    const user = userEvent.setup();
    render(<EditableCell productId="p-1" field="name" value="Piñata estrella" />);

    const input = screen.getByRole("textbox");
    // First edit + blur: should save
    await user.clear(input);
    await user.type(input, "Piñata gigante");
    await user.tab();

    expect(mockUpdateProductField).toHaveBeenCalledTimes(1);
    expect(mockUpdateProductField).toHaveBeenCalledWith("p-1", "name", "Piñata gigante");

    // Second focus + blur: no edit, should NOT save again
    await user.click(input);
    await user.tab();

    expect(mockUpdateProductField).toHaveBeenCalledTimes(1);
  });
});
