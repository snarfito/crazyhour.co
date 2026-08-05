import { describe, it, expect } from "vitest";
// Next.js 16.3.0's bundled docs (node_modules/next/dist/docs/.../proxy.md) call
// this `unstable_doesProxyMatch`, but the shipped package still exports the
// pre-rename name `unstable_doesMiddlewareMatch` (see
// node_modules/next/dist/experimental/testing/server/middleware-testing-utils.d.ts).
// Same signature, docs/code naming drift — aliasing to match the brief's intent.
import { unstable_doesMiddlewareMatch as unstable_doesProxyMatch } from "next/experimental/testing/server";
import { config } from "./proxy";

describe("proxy matcher", () => {
  it("matches /admin routes", () => {
    expect(
      unstable_doesProxyMatch({ config, nextConfig: {}, url: "/admin/categorias" })
    ).toBe(true);
  });

  it("does not match public routes", () => {
    expect(unstable_doesProxyMatch({ config, nextConfig: {}, url: "/" })).toBe(false);
  });

  it("does not match static assets", () => {
    expect(
      unstable_doesProxyMatch({ config, nextConfig: {}, url: "/_next/static/chunk.js" })
    ).toBe(false);
  });
});
