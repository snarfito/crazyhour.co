import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DeleteForm } from "./delete-form";

describe("DeleteForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not call the action when the confirmation is dismissed", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const action = vi.fn();

    render(<DeleteForm action={action} confirmMessage="¿Eliminar?" />);
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(window.confirm).toHaveBeenCalledWith("¿Eliminar?");
    expect(action).not.toHaveBeenCalled();
  });

  it("calls the action when the confirmation is accepted", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const action = vi.fn();

    render(<DeleteForm action={action} confirmMessage="¿Eliminar?" />);
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(action).toHaveBeenCalled();
  });
});
