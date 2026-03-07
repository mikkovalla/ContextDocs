import { describe, expect, it } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { updateAgentsMd } from "../../../core/writer/agents-md-updater";
import { ResolvedTarget } from "../../../types";

const TARGETS: ResolvedTarget[] = [
  {
    packageName: "next",
    normalizedName: "next",
    selectedSource: {
      kind: "llms_txt",
      url: "https://nextjs.org/llms.txt",
      description: "Next llms",
    },
    sourceCandidates: [
      {
        kind: "llms_txt",
        url: "https://nextjs.org/llms.txt",
        description: "Next llms",
      },
    ],
    sourceRanking: [
      {
        kind: "llms_txt",
        url: "https://nextjs.org/llms.txt",
        origin: "curated",
        rank: 1,
        reason: "Curated npm profile candidate.",
      },
    ],
    versionContext: {
      requestedVersion: "16.0.0",
      normalizedVersion: "16.0.0",
      exactVersion: "16.0.0",
      major: 16,
      minor: 0,
      patch: 0,
      stability: "stable",
      compatibilityTarget: "major:16",
      reason: "Detected stable version 16.0.0.",
    },
    compositionType: "mdx_tree",
    confidence: 0.95,
  },
];

describe("updateAgentsMd", () => {
  it("writes stable marked block idempotently", async () => {
    const root = await mkdtemp(join(tmpdir(), "contextdocs-agents-"));

    await updateAgentsMd(root, TARGETS);
    const first = await Bun.file(join(root, "AGENTS.md")).text();

    await updateAgentsMd(root, TARGETS);
    const second = await Bun.file(join(root, "AGENTS.md")).text();

    expect(first).toContain("<!-- CONTEXTDOCS:START -->");
    expect(first).toContain("<!-- CONTEXTDOCS:END -->");
    expect(second).toBe(first);
  });

  it("migrates a legacy DOCBRAIN block to CONTEXTDOCS markers", async () => {
    const root = await mkdtemp(join(tmpdir(), "contextdocs-migrate-"));
    await Bun.write(
      join(root, "AGENTS.md"),
      [
        "# AI Agent Instructions",
        "",
        "<!-- DOCBRAIN:START -->",
        "## Local Documentation Indexes",
        "",
        "- react: read `/tmp/react` first.",
        "",
        "<!-- DOCBRAIN:END -->",
        "",
      ].join("\n"),
    );

    await updateAgentsMd(root, TARGETS);
    const updated = await Bun.file(join(root, "AGENTS.md")).text();

    expect(updated).toContain("<!-- CONTEXTDOCS:START -->");
    expect(updated).toContain("<!-- CONTEXTDOCS:END -->");
    expect(updated).not.toContain("<!-- DOCBRAIN:START -->");
    expect(updated).not.toContain("<!-- DOCBRAIN:END -->");
    expect(updated).toContain("- react:");
    expect(updated).toContain("- next:");
  });
});
