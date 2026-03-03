import { describe, expect, it } from "bun:test";
import { splitLlmsFullMarkdown } from "../../../core/fetcher/llms";

describe("splitLlmsFullMarkdown", () => {
  it("splits monolithic llms markdown into section files", () => {
    const content = [
      "Zod docs preface.",
      "",
      "# Defining schemas",
      "Details for schemas.",
      "",
      "# Strings",
      "Details for string methods.",
      "",
      "# Arrays",
      "Details for arrays.",
    ].join("\n");

    const files = splitLlmsFullMarkdown(
      content,
      "https://zod.dev/llms-full.txt",
    );

    expect(files[0].relativePath).toBe("llms-full.md");
    expect(
      files.some((file) => file.relativePath === "sections/00-overview.md"),
    ).toBe(true);
    expect(
      files.some(
        (file) => file.relativePath === "sections/01-defining-schemas.md",
      ),
    ).toBe(true);
    expect(
      files.some((file) => file.relativePath === "sections/02-strings.md"),
    ).toBe(true);
    expect(
      files.some((file) => file.relativePath === "sections/03-arrays.md"),
    ).toBe(true);
  });

  it("falls back to full snapshot when no section headings are found", () => {
    const files = splitLlmsFullMarkdown(
      "plain text with no markdown heading markers",
      "https://example.dev/llms-full.txt",
    );

    expect(files).toHaveLength(1);
    expect(files[0].relativePath).toBe("llms-full.md");
  });
});
