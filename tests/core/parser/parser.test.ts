import { describe, expect, it } from "bun:test";
import { normalizeHtml } from "../../../core/parser/html";
import { normalizeMarkdown } from "../../../core/parser/markdown";

describe("parser normalization", () => {
  it("keeps markdown headings and code blocks", async () => {
    const normalized = await normalizeMarkdown(`# Title\n\n\`\`\`ts\nconst a = 1\n\`\`\``);

    expect(normalized).toContain("# Title");
    expect(normalized).toContain("```ts");
  });

  it("strips noisy html tags", async () => {
    const normalized = await normalizeHtml(
      "<html><head><title>Doc</title></head><body><nav>x</nav><main><h1>Hello</h1><p>World</p></main></body></html>",
      "https://example.dev/docs",
    );

    expect(normalized).toContain("# Hello");
    expect(normalized).toContain("Source: https://example.dev/docs");
    expect(normalized).not.toContain("<nav>");
  });
});
