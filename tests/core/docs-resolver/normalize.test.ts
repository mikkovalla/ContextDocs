import { describe, expect, it } from "bun:test";
import {
  dedupePackageNames,
  normalizeNpmPackageName,
} from "../../../core/docs-resolver/npm-normalize";

describe("npm normalize", () => {
  it("normalizes aliases and scoped families", () => {
    expect(normalizeNpmPackageName("NextJS")).toBe("next");
    expect(normalizeNpmPackageName("@nestjs/common")).toBe("nestjs");
    expect(normalizeNpmPackageName("AcernityUI")).toBe("aceternity");
    expect(normalizeNpmPackageName("@supabase/supabase-js")).toBe("supabase");
  });

  it("deduplicates by normalized package", () => {
    const deduped = dedupePackageNames([
      "NextJS",
      "next",
      "drizzle",
      "drizzle-orm",
      "zod",
    ]);

    expect(deduped).toEqual(["NextJS", "drizzle", "zod"]);
  });
});
