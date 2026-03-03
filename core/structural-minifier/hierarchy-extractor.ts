import { DenseFileMap } from "../../types";

const TAG_KEYWORDS = [
  "api",
  "guide",
  "migration",
  "reference",
  "authentication",
  "database",
  "query",
  "schema",
  "component",
  "routing",
  "server",
  "client",
  "typescript",
  "testing",
  "deployment",
];

function toTitleFromPath(filePath: string): string {
  const filename = filePath.split("/").pop() ?? "documentation";
  return filename
    .replace(/\.(md|mdx|txt)$/i, "")
    .replaceAll(/[-_]+/g, " ")
    .trim();
}

function extractHeadings(markdownContent: string): string[] {
  const headings = markdownContent
    .split("\n")
    .map((line) => new RegExp(/^#{1,4}\s+(.+)$/).exec(line)?.[1]?.trim())
    .filter((heading): heading is string => Boolean(heading));

  return Array.from(new Set(headings)).slice(0, 10);
}

function inferTags(markdownContent: string, filePath: string): string[] {
  const corpus = `${filePath}\n${markdownContent}`.toLowerCase();
  return TAG_KEYWORDS.filter((keyword) => corpus.includes(keyword)).slice(0, 8);
}

function buildHint(filePath: string, headings: string[]): string {
  if (headings.length === 0) {
    return `Read ${filePath} for implementation details.`;
  }

  return `Start with "${headings[0]}" in ${filePath}.`;
}

export async function extractDenseMap(
  filePath: string,
  markdownContent: string,
): Promise<DenseFileMap> {
  const headings = extractHeadings(markdownContent);
  const topic = headings[0] ?? toTitleFromPath(filePath);
  const tags = inferTags(markdownContent, filePath);

  return {
    filePath,
    topic,
    headings,
    tags,
    hint: buildHint(filePath, headings),
  };
}
