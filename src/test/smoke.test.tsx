import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

function Hello() {
  return <p>crazy hour test harness</p>;
}

describe("test harness smoke test", () => {
  it("renders text and finds it with RTL", () => {
    render(<Hello />);
    expect(screen.getByText("crazy hour test harness")).toBeInTheDocument();
  });
});
