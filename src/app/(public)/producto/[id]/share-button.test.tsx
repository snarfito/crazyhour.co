import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShareButton } from "./share-button";

afterEach(() => {
  // @ts-expect-error -- test-only cleanup of a property we defined below
  delete navigator.share;
  // @ts-expect-error -- test-only cleanup of a property we defined below
  delete navigator.clipboard;
});

describe("ShareButton", () => {
  it("uses the native share sheet when available", async () => {
    // userEvent.setup() installs its own clipboard stub, so the navigator
    // overrides must come after it or it clobbers them.
    const user = userEvent.setup();
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    render(<ShareButton name="Piñata estrella" />);

    await user.click(screen.getByLabelText("Compartir"));

    expect(share).toHaveBeenCalledWith({ title: "Piñata estrella", url: window.location.href });
  });

  it("falls back to copying the link when navigator.share is unavailable", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<ShareButton name="Piñata estrella" />);

    await user.click(screen.getByLabelText("Compartir"));

    await waitFor(() => expect(screen.getByLabelText("Enlace copiado")).toBeInTheDocument());
    expect(writeText).toHaveBeenCalledWith(window.location.href);
  });
});
