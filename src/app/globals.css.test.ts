import { describe, it, expect } from "vitest";
// The plain `tailwindcss` package's `compile()` requires the caller to supply
// `loadStylesheet`/`loadModule` resolvers to follow `@import` statements.
// `@tailwindcss/node` is the package `@tailwindcss/postcss` itself uses
// internally to implement those resolvers via real Node module resolution,
// so it lets this test compile the actual globals.css (with its `@import
// "tailwindcss"`, `@import "tw-animate-css"`, `@import "shadcn/tailwind.css"`)
// through the real pipeline instead of a hand-rolled stub.
import { compile } from "@tailwindcss/node";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("globals.css compiles the expected utilities", () => {
  it("emits font-heading, font-body, and all brand-color utilities", async () => {
    const css = readFileSync(path.resolve(__dirname, "globals.css"), "utf-8");
    const compiler = await compile(css, {
      base: path.resolve(__dirname, "../.."),
      onDependency: () => {},
    });
    const output = compiler.build([
      "font-heading",
      "font-body",
      "bg-brand-orange",
      "bg-brand-yellow",
      "bg-brand-red",
      "bg-brand-green",
      "bg-brand-whatsapp",
    ]);
    expect(output).toContain(".font-heading");
    expect(output).toContain(".font-body");
    expect(output).toContain(".bg-brand-orange");
    expect(output).toContain(".bg-brand-yellow");
    expect(output).toContain(".bg-brand-red");
    expect(output).toContain(".bg-brand-green");
    expect(output).toContain(".bg-brand-whatsapp");
  });
});
