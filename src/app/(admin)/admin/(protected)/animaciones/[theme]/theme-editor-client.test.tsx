import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeEditorClient } from "./theme-editor-client";

vi.mock("./actions", () => ({
  updateThemeSettingsAction: vi.fn(),
}));

const INITIAL = {
  particleCount: 8, minDuration: 14, maxDuration: 22,
  minSize: 16, maxSize: 28, maxOpacity: 0.18, customCss: null,
};

describe("ThemeEditorClient", () => {
  it("renders the initial particle count in the preview", () => {
    const { container } = render(<ThemeEditorClient theme="carnaval" initial={INITIAL} />);
    expect(container.querySelectorAll(".event-particle")).toHaveLength(8);
  });

  it("updates the preview immediately when the particle count changes, without submitting", () => {
    const { container } = render(<ThemeEditorClient theme="carnaval" initial={INITIAL} />);
    const countInput = screen.getByLabelText(/cantidad de partículas/i) as HTMLInputElement;

    fireEvent.change(countInput, { target: { value: "15" } });

    expect(container.querySelectorAll(".event-particle")).toHaveLength(15);
  });

  it("visually marks the speed inputs inert (but not HTML-disabled) once custom CSS has content", async () => {
    render(<ThemeEditorClient theme="carnaval" initial={INITIAL} />);
    const cssBox = screen.getByLabelText(/css avanzado/i);
    const minDurationInput = screen.getByLabelText(/velocidad mínima/i) as HTMLInputElement;

    expect(minDurationInput).not.toBeDisabled();
    await userEvent.click(cssBox);
    await userEvent.paste(".event-particle { animation: none; }");

    expect(minDurationInput).not.toBeDisabled();
    expect(minDurationInput).toHaveClass("opacity-40", "pointer-events-none");
  });
});
