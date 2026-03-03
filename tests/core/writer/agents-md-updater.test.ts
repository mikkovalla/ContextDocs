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
    compositionType: "mdx_tree",
    confidence: 0.95,
  },
];

describe("updateAgentsMd", () => {
  it("writes stable marked block idempotently", async () => {
    const root = await mkdtemp(join(tmpdir(), "docbrain-agents-"));

    await updateAgentsMd(root, TARGETS);
    const first = await Bun.file(join(root, "AGENTS.md")).text();

    await updateAgentsMd(root, TARGETS);
    const second = await Bun.file(join(root, "AGENTS.md")).text();

    expect(first).toContain("<!-- DOCBRAIN:START -->");
    expect(first).toContain("<!-- DOCBRAIN:END -->");
    expect(second).toBe(first);
  });
});
