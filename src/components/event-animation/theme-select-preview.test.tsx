import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeSelectPreview } from "./theme-select-preview";

const OPTIONS = [
  { value: "none", label: "Ninguno" },
  { value: "navidad", label: "Navidad" },
  { value: "carnaval", label: "Carnaval" },
];

describe("ThemeSelectPreview", () => {
  it("renders no particles in the preview box when the initial theme is none", () => {
    const { container } = render(
      <ThemeSelectPreview id="t" name="t" initialTheme="none" options={OPTIONS} className="" />,
    );
    expect(container.querySelectorAll(".event-particle")).toHaveLength(0);
  });

  it("updates the preview immediately when a new option is picked, without any submit", async () => {
    render(<ThemeSelectPreview id="t" name="t" initialTheme="none" options={OPTIONS} className="" />);
    const select = screen.getByRole("combobox") as HTMLSelectElement;

    await userEvent.selectOptions(select, "carnaval");

    expect(select.value).toBe("carnaval");
    expect(document.querySelectorAll(".event-particle").length).toBeGreaterThan(0);
  });

  it("renders nothing in the preview box for the empty-string 'inherit' value", () => {
    const { container } = render(
      <ThemeSelectPreview id="t" name="t" initialTheme="" options={[{ value: "", label: "Usar tema del sitio" }, ...OPTIONS]} className="" />,
    );
    expect(container.querySelectorAll(".event-particle")).toHaveLength(0);
  });
});
