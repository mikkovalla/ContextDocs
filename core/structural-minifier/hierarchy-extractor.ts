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

function toSnakeCaseToken(value: string): string {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/`/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");

  return normalized.toLowerCase() || "section";
}

function toFeatureModuleToken(filePath: string, headings: string[]): string {
  const fromHeading = headings[0] ? toSnakeCaseToken(headings[0]) : "";

  const baseName = filePath.split("/").pop() ?? filePath;
  const fromPath = toSnakeCaseToken(
    baseName.replace(/\.(md|mdx|txt)$/i, "").replace(/^\d+[-_]+/, ""),
  );

  const raw = fromHeading || fromPath || "section";
  return `${raw[0]?.toUpperCase() ?? "S"}${raw.slice(1)}`;
}

function toHeadingAnchor(heading: string): string {
  const slug = heading
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return slug || "section";
}

function extractFeatureRefs(filePath: string, headings: string[]): string[] {
  const moduleToken = toFeatureModuleToken(filePath, headings);
  const seen = new Map<string, number>();

  const refs = headings.map((heading) => {
    const featureToken = toSnakeCaseToken(heading);
    const prior = seen.get(featureToken) ?? 0;
    seen.set(featureToken, prior + 1);
    const suffix = prior > 0 ? `_${prior + 1}` : "";
    const anchor = toHeadingAnchor(heading);
    return `${moduleToken}.${featureToken}${suffix}=>${filePath}#${anchor}`;
  });

  return refs.slice(0, 12);
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
  const featureRefs = extractFeatureRefs(filePath, headings);
  const tags = inferTags(markdownContent, filePath);

  return {
    filePath,
    topic,
    headings,
    featureRefs,
    tags,
    hint: buildHint(filePath, headings),
  };
}
