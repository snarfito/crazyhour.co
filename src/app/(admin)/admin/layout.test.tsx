import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminLayout from "./layout";

describe("admin layout", () => {
  it("applies the light theme class", () => {
    render(
      <AdminLayout>
        <p>contenido</p>
      </AdminLayout>
    );
    const root = screen.getByTestId("admin-theme-root");
    expect(root).toHaveClass("theme-light");
  });
});
