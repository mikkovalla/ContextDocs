import { RawDocFile, ResolvedSourceCandidate } from "../../types";

function toMarkdown(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value, null, 2);
}

export async function fetchFromRegistryJson(
  candidate: ResolvedSourceCandidate,
): Promise<RawDocFile[]> {
  const response = await fetch(candidate.url);

  if (!response.ok) {
    throw new Error(`Failed to fetch registry json: ${candidate.url}`);
  }

  const body = await response.text();
  let parsed: unknown = body;

  try {
    parsed = JSON.parse(body);
  } catch {
    // Keep raw body as text if not valid JSON.
  }

  const markdown = `# Registry Payload\n\nSource: ${candidate.url}\n\n\`\`\`json\n${toMarkdown(parsed)}\n\`\`\``;

  return [
    {
      relativePath: "registry/payload.md",
      content: markdown,
      sourceUrl: candidate.url,
      contentType: "markdown",
    },
  ];
}
