import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { ParsedDependency } from "../../../types";
import { resolveDocsTargets } from "../../../core/docs-resolver/resolver";

const originalFetch = globalThis.fetch;

describe("resolveDocsTargets", () => {
  beforeEach(() => {
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          "dist-tags": { latest: "1.0.0" },
          versions: {
            "1.0.0": {
              homepage: "https://example.dev",
              repository: { url: "https://github.com/example/repo.git" },
            },
          },
          readme: "# Example",
        }),
        { status: 200 },
      );
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("uses llms as primary source when available", async () => {
    const deps: ParsedDependency[] = [
      { name: "zod", version: "3.0.0", ecosystem: "npm" },
    ];

    const targets = await resolveDocsTargets(deps, "llms");

    expect(targets).toHaveLength(1);
    expect(targets[0].normalizedName).toBe("zod");
    expect(targets[0].selectedSource.kind).toBe("llms_full");
  });

  it("normalizes aliases", async () => {
    const deps: ParsedDependency[] = [
      { name: "NextJS", version: "16.0.0", ecosystem: "npm" },
    ];

    const targets = await resolveDocsTargets(deps, "github");

    expect(targets).toHaveLength(1);
    expect(targets[0].normalizedName).toBe("next");
  });
});
