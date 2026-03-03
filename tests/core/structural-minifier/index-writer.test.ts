import { describe, expect, it } from "bun:test";
import { mkdtemp, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateMinifiedIndex } from "../../../core/structural-minifier/index-writer";

describe("generateMinifiedIndex", () => {
  it("builds compact index with paths and headings", async () => {
    const dir = await mkdtemp(join(tmpdir(), "docbrain-index-"));
    await mkdir(join(dir, "guide"), { recursive: true });

    await Bun.write(
      join(dir, "guide", "intro.md"),
      "# Intro\n\n## Setup\n\nInstall package",
    );

    const indexPath = await generateMinifiedIndex(dir, "test-package");
    const content = await Bun.file(indexPath).text();

    expect(content).toContain('<docbrain_index package="test-package">');
    expect(content).toContain("path: guide/intro.md");
    expect(content).toContain("headings: Intro | Setup");
    expect(content).toContain("hint:");
  });
});
