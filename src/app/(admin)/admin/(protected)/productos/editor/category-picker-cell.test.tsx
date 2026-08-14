import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryPickerCell } from "./category-picker-cell";

const mockUpdateProductCategories = vi.fn().mockResolvedValue(undefined);
vi.mock("./actions", () => ({
  updateProductCategories: (...args: unknown[]) => mockUpdateProductCategories(...args),
}));

const categories = [
  { id: "cat-a", name: "Piñatas" },
  { id: "cat-b", name: "Globos" },
];

describe("CategoryPickerCell", () => {
  beforeEach(() => {
    mockUpdateProductCategories.mockReset().mockResolvedValue(undefined);
  });

  it("shows the currently selected category names on the trigger", () => {
    render(<CategoryPickerCell productId="p-1" categories={categories} selectedCategoryIds={["cat-a"]} />);
    expect(screen.getByRole("button", { name: "Piñatas" })).toBeInTheDocument();
  });

  it("shows a placeholder when no category is selected", () => {
    render(<CategoryPickerCell productId="p-1" categories={categories} selectedCategoryIds={[]} />);
    expect(screen.getByRole("button", { name: "Sin categoría" })).toBeInTheDocument();
  });

  it("checking a box saves the full new category set", async () => {
    const user = userEvent.setup();
    render(<CategoryPickerCell productId="p-1" categories={categories} selectedCategoryIds={["cat-a"]} />);

    await user.click(screen.getByRole("button", { name: "Piñatas" }));
    const popup = await screen.findByRole("checkbox", { name: "Globos" });
    await user.click(popup);

    expect(mockUpdateProductCategories).toHaveBeenCalledWith("p-1", ["cat-a", "cat-b"]);
  });

  it("unchecking a box saves the reduced set", async () => {
    const user = userEvent.setup();
    render(<CategoryPickerCell productId="p-1" categories={categories} selectedCategoryIds={["cat-a", "cat-b"]} />);

    await user.click(screen.getByRole("button", { name: "Piñatas, Globos" }));
    const checkbox = await screen.findByRole("checkbox", { name: "Piñatas" });
    await user.click(checkbox);

    expect(mockUpdateProductCategories).toHaveBeenCalledWith("p-1", ["cat-b"]);
  });

  it("reverts the checkbox and shows an inline error when the save fails", async () => {
    mockUpdateProductCategories.mockRejectedValueOnce(new Error("No se pudo guardar el cambio."));
    const user = userEvent.setup();
    render(<CategoryPickerCell productId="p-1" categories={categories} selectedCategoryIds={["cat-a"]} />);

    await user.click(screen.getByRole("button", { name: "Piñatas" }));
    const checkbox = await screen.findByRole("checkbox", { name: "Globos" });
    await user.click(checkbox);

    expect(await screen.findByText("No se pudo guardar el cambio.")).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });
});
