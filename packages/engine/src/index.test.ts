import { describe, expect, it } from "vitest";
import { engineVersion } from "./index.ts";

describe("engineVersion", () => {
  it("returns a semver-like string", () => {
    expect(engineVersion()).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
